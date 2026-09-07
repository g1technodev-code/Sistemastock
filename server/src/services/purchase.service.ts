import { Prisma, MovementType, PurchaseStatus, CashMovementType, SupplierMovementType, PaymentMethod } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import { getOrCreateRegister } from "./cash.service";
import type { CreatePurchaseInput, ListPurchasesQuery, UpdatePurchaseInput } from "../schemas/purchase.schema";

const PURCHASE_INCLUDE = {
  items: { include: { product: { select: { id: true, sku: true, name: true, unit: true } } } },
  supplier: { select: { id: true, name: true } },
  user: { select: { id: true, name: true } },
  receivedBy: { select: { id: true, name: true } },
  cancelledBy: { select: { id: true, name: true } },
};

type PurchaseItemData = { productId: string; quantity: number; unitCost: number; subtotal: number };

async function buildItemsData(
  tx: Prisma.TransactionClient,
  lines: { productId: string; quantity: number; unitCost: number }[],
): Promise<{ items: PurchaseItemData[]; total: number }> {
  let total = 0;
  const items: PurchaseItemData[] = [];
  for (const line of lines) {
    const product = await tx.product.findUnique({ where: { id: line.productId } });
    if (!product) throw ApiError.notFound(`Producto no encontrado: ${line.productId}`);
    const subtotal = Math.round(line.unitCost * line.quantity * 100) / 100;
    total += subtotal;
    items.push({ productId: line.productId, quantity: line.quantity, unitCost: line.unitCost, subtotal });
  }
  return { items, total: Math.round(total * 100) / 100 };
}

export async function createPurchase(
  localId: string | null | undefined,
  input: CreatePurchaseInput,
  userId: string,
  txClient?: Prisma.TransactionClient
) {
  if (!localId) throw ApiError.badRequest("Debe estar asociado a un local");
  
  const execute = async (tx: Prisma.TransactionClient) => {
    const supplier = await tx.supplier.findFirst({ where: { id: input.supplierId, localId } });
    if (!supplier) throw ApiError.notFound("Proveedor no encontrado");
    if (!supplier.isActive) throw ApiError.badRequest("El proveedor está inactivo");

    const { items, total } = await buildItemsData(tx, input.items);

    const purchase = await tx.purchase.create({
      data: {
        localId,
        supplierId: input.supplierId,
        purchaseOrderId: input.purchaseOrderId || null,
        userId,
        note: input.note?.trim() || null,
        total,
        status: PurchaseStatus.RECEIVED,
        receivedById: userId,
        receivedAt: new Date(),
        paymentMethod: input.paymentMethod || null,
        receiptNumber: input.receiptNumber?.trim() || null,
        items: { create: items },
      },
      include: PURCHASE_INCLUDE,
    });

    const sortedItems = [...purchase.items].sort((a, b) => a.productId.localeCompare(b.productId));
    for (const item of sortedItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { increment: item.quantity } },
      });
      const fresh = await tx.product.findUnique({ where: { id: item.productId } });
      const quantityAfter = fresh!.currentStock;
      const quantityBefore = quantityAfter - item.quantity;

      await tx.stockMovement.create({
        data: {
          localId,
          productId: item.productId,
          type: MovementType.IN,
          quantity: item.quantity,
          quantityBefore,
          quantityAfter,
          unitCost: item.unitCost,
          reason: "Compra directa o recepción de pedido",
          reference: `purchase:${purchase.id}`,
          userId,
        },
      });

      if (Number(fresh!.costPrice) !== Number(item.unitCost)) {
        await tx.product.update({ where: { id: item.productId }, data: { costPrice: item.unitCost } });
      }
    }

    if (input.paymentMethod) {
      if (input.paymentMethod === PaymentMethod.EFECTIVO) {
        const register = await getOrCreateRegister(tx, localId);
        
        await tx.cashRegister.update({
          where: { id: register.id },
          data: { currentBalance: { decrement: total } },
        });

        const freshRegister = await tx.cashRegister.findUnique({ where: { id: register.id } });
        const cashBalanceAfter = Number(freshRegister!.currentBalance);
        const cashBalanceBefore = cashBalanceAfter + total;

        const cashMovement = await tx.cashMovement.create({
          data: {
            localId,
            type: CashMovementType.PURCHASE_OUT,
            amount: total,
            balanceBefore: cashBalanceBefore,
            balanceAfter: cashBalanceAfter,
            userId,
            note: `Compra en efectivo a ${supplier.name} ${input.receiptNumber ? '(Comprobante: ' + input.receiptNumber + ')' : ''}`,
          },
        });

        await tx.purchase.update({
          where: { id: purchase.id },
          data: { cashMovementId: cashMovement.id },
        });
      } else if (input.paymentMethod === PaymentMethod.CUENTA_CORRIENTE) {
        await tx.supplier.update({
          where: { id: supplier.id },
          data: { currentBalance: { increment: total } },
        });
        
        const freshSupplier = await tx.supplier.findUnique({ where: { id: supplier.id } });
        const balanceAfter = Number(freshSupplier!.currentBalance);
        const balanceBefore = balanceAfter - total;

        await tx.supplierMovement.create({
          data: {
            supplierId: supplier.id,
            type: SupplierMovementType.CHARGE,
            amount: total,
            balanceBefore,
            balanceAfter,
            purchaseId: purchase.id,
            userId,
            note: `Compra a crédito ${input.receiptNumber ? '(Comprobante: ' + input.receiptNumber + ')' : ''}`,
          },
        });
      }
    }

    return purchase;
  };

  return txClient ? execute(txClient) : prisma.$transaction(execute);
}

export async function updatePurchase(localId: string | null | undefined, id: string, input: UpdatePurchaseInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.purchase.findFirst({ where: { id, ...(localId ? { localId } : {}) } });
    if (!existing) throw ApiError.notFound("Compra no encontrada");
    if (existing.status !== PurchaseStatus.PENDING) {
      throw ApiError.badRequest("Solo se pueden editar compras pendientes. Si necesitas modificarla, cancélala e ingresa una nueva.");
    }

    const supplier = await tx.supplier.findFirst({ where: { id: input.supplierId, ...(localId ? { localId } : {}) } });
    if (!supplier) throw ApiError.notFound("Proveedor no encontrado");

    const { items, total } = await buildItemsData(tx, input.items);

    await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
    await tx.purchase.update({
      where: { id },
      data: { supplierId: input.supplierId, note: input.note?.trim() || null, total, items: { create: items } },
    });

    return tx.purchase.findUnique({ where: { id }, include: PURCHASE_INCLUDE });
  });
}

function buildWhere(localId: string | null | undefined, query: ListPurchasesQuery): Prisma.PurchaseWhereInput {
  const where: Prisma.PurchaseWhereInput = {
    ...(localId ? { localId } : {}),
  };
  if (query.supplierId) where.supplierId = query.supplierId;
  if (query.status) where.status = query.status;
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) where.createdAt.lte = new Date(query.to);
  }
  return where;
}

export async function listPurchases(localId: string | null | undefined, query: ListPurchasesQuery) {
  const where = buildWhere(localId, query);
  const pagination = parsePagination(query);

  const [items, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: PURCHASE_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.purchase.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}

export async function getPurchase(localId: string | null | undefined, id: string) {
  const purchase = await prisma.purchase.findFirst({
    where: { id, ...(localId ? { localId } : {}) },
    include: PURCHASE_INCLUDE,
  });
  if (!purchase) throw ApiError.notFound("Compra no encontrada");
  return purchase;
}

export async function receivePurchase(localId: string | null | undefined, id: string, userId: string) {
  throw ApiError.badRequest("Por favor, utilice el flujo de Pedidos a Proveedores para recepcionar stock.");
}

export async function cancelPurchase(localId: string | null | undefined, id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findFirst({ where: { id, ...(localId ? { localId } : {}) } });
    if (!purchase) throw ApiError.notFound("Compra no encontrada");
    if (purchase.status !== PurchaseStatus.PENDING) {
      throw ApiError.badRequest("Solo se pueden cancelar compras pendientes (las compras ya recibidas no se pueden cancelar de esta forma).");
    }

    return tx.purchase.update({
      where: { id },
      data: { status: PurchaseStatus.CANCELLED, cancelledById: userId, cancelledAt: new Date() },
      include: PURCHASE_INCLUDE,
    });
  });
}
