import { Prisma, MovementType, PurchaseStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import { parsePagination, paginatedResponse } from "../utils/pagination";
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

export async function createPurchase(localId: string | null | undefined, input: CreatePurchaseInput, userId: string) {
  if (!localId) throw ApiError.badRequest("Debe estar asociado a un local");
  return prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.findFirst({ where: { id: input.supplierId, localId } });
    if (!supplier) throw ApiError.notFound("Proveedor no encontrado");

    const { items, total } = await buildItemsData(tx, input.items);

    const purchase = await tx.purchase.create({
      data: {
        localId,
        supplierId: input.supplierId,
        userId,
        note: input.note?.trim() || null,
        total,
        items: { create: items },
      },
      include: PURCHASE_INCLUDE,
    });

    return purchase;
  });
}

export async function updatePurchase(localId: string | null | undefined, id: string, input: UpdatePurchaseInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.purchase.findFirst({ where: { id, ...(localId ? { localId } : {}) } });
    if (!existing) throw ApiError.notFound("Compra no encontrada");
    if (existing.status !== PurchaseStatus.PENDING) {
      throw ApiError.badRequest("Solo se pueden editar compras pendientes");
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
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findFirst({
      where: { id, ...(localId ? { localId } : {}) },
      include: { items: true },
    });
    if (!purchase) throw ApiError.notFound("Compra no encontrada");
    if (purchase.status !== PurchaseStatus.PENDING) {
      throw ApiError.badRequest("Solo se pueden recibir compras pendientes");
    }

    // Stable productId order so concurrent purchase receipts sharing a product always
    // acquire row locks in the same order — same deadlock-avoidance pattern as sale.service.
    const sortedItems = [...purchase.items].sort((a, b) => a.productId.localeCompare(b.productId));

    for (const item of sortedItems) {
      // Receiving only ever increases stock, so no conditional guard is needed here —
      // unlike the OUT/decrement path in stock.service.ts.
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { increment: item.quantity } },
      });
      const fresh = await tx.product.findUnique({ where: { id: item.productId } });
      const quantityAfter = fresh!.currentStock;
      const quantityBefore = quantityAfter - item.quantity;

      await tx.stockMovement.create({
        data: {
          localId: purchase.localId,
          productId: item.productId,
          type: MovementType.IN,
          quantity: item.quantity,
          quantityBefore,
          quantityAfter,
          unitCost: item.unitCost,
          reason: "Compra recibida",
          reference: `purchase:${purchase.id}`,
          userId,
        },
      });


      // Update the product's cost basis to the latest purchase price when it changed.
      if (Number(fresh!.costPrice) !== Number(item.unitCost)) {
        await tx.product.update({ where: { id: item.productId }, data: { costPrice: item.unitCost } });
      }
    }

    return tx.purchase.update({
      where: { id },
      data: { status: PurchaseStatus.RECEIVED, receivedById: userId, receivedAt: new Date() },
      include: PURCHASE_INCLUDE,
    });
  });
}

export async function cancelPurchase(localId: string | null | undefined, id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findFirst({ where: { id, ...(localId ? { localId } : {}) } });
    if (!purchase) throw ApiError.notFound("Compra no encontrada");
    if (purchase.status !== PurchaseStatus.PENDING) {
      throw ApiError.badRequest("Solo se pueden cancelar compras pendientes");
    }

    return tx.purchase.update({
      where: { id },
      data: { status: PurchaseStatus.CANCELLED, cancelledById: userId, cancelledAt: new Date() },
      include: PURCHASE_INCLUDE,
    });
  });
}
