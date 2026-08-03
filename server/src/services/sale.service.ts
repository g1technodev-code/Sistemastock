import { Prisma, MovementType, PaymentMethod, SaleStatus, CashMovementType, CashShiftStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import { getOrCreateRegister, CASH_REGISTER_ID } from "./cash.service";
import type { CreateSaleInput, ListSalesQuery, SalesSummaryQuery } from "../schemas/sale.schema";

const SALE_INCLUDE = {
  items: { include: { product: { select: { id: true, sku: true, name: true, unit: true } } } },
  user: { select: { id: true, name: true } },
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

type PendingMovement = {
  productId: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  unitCost: Prisma.Decimal;
};

export async function createSale(input: CreateSaleInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const openShift = await tx.cashShift.findFirst({
      where: { openedById: userId, status: CashShiftStatus.OPEN },
    });
    if (!openShift) {
      throw ApiError.badRequest("Debes abrir tu turno de caja antes de registrar ventas");
    }

    // Process lines in a stable productId order so concurrent sales sharing a product
    // always acquire row locks in the same order — avoids cross-transaction deadlocks.
    const sortedItems = [...input.items].sort((a, b) => a.productId.localeCompare(b.productId));

    let total = 0;
    const saleItemsData: { productId: string; quantity: number; unitPrice: number; subtotal: number }[] = [];
    const pendingMovements: PendingMovement[] = [];

    for (const line of sortedItems) {
      const product = await tx.product.findUnique({ where: { id: line.productId } });
      if (!product) throw ApiError.notFound(`Producto no encontrado: ${line.productId}`);
      if (!product.isActive) throw ApiError.badRequest(`El producto "${product.name}" no está activo`);

      // Atomic conditional decrement — same guard pattern as stock.service.ts's OUT
      // movement, so two concurrent sales can't both pass a stale stock check.
      const result = await tx.product.updateMany({
        where: { id: line.productId, currentStock: { gte: line.quantity } },
        data: { currentStock: { decrement: line.quantity } },
      });
      if (result.count === 0) {
        const fresh = await tx.product.findUnique({ where: { id: line.productId } });
        throw ApiError.badRequest(
          `Stock insuficiente para "${product.name}". Disponible: ${fresh?.currentStock ?? product.currentStock}, solicitado: ${line.quantity}`,
        );
      }

      // Re-read post-write inside the same transaction rather than trusting the
      // pre-write snapshot, which could be stale under concurrent sales on this product.
      const fresh = await tx.product.findUnique({ where: { id: line.productId } });
      const quantityAfter = fresh!.currentStock;
      const quantityBefore = quantityAfter + line.quantity;

      const unitPrice = Number(product.sellPrice);
      const subtotal = Math.round(unitPrice * line.quantity * 100) / 100;
      total += subtotal;

      saleItemsData.push({ productId: line.productId, quantity: line.quantity, unitPrice, subtotal });
      pendingMovements.push({
        productId: line.productId,
        quantity: line.quantity,
        quantityBefore,
        quantityAfter,
        unitCost: product.costPrice,
      });
    }

    total = Math.round(total * 100) / 100;

    const sale = await tx.sale.create({
      data: {
        total,
        paymentMethod: input.paymentMethod,
        userId,
        receiptNumber: input.receiptNumber?.trim() || null,
        payerName: input.payerName?.trim() || null,
      },
    });

    for (const item of saleItemsData) {
      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        },
      });
    }

    for (const movement of pendingMovements) {
      await tx.stockMovement.create({
        data: {
          productId: movement.productId,
          type: MovementType.OUT,
          quantity: movement.quantity,
          quantityBefore: movement.quantityBefore,
          quantityAfter: movement.quantityAfter,
          unitCost: movement.unitCost,
          reason: "Venta",
          reference: `sale:${sale.id}`,
          userId,
        },
      });
    }

    if (input.paymentMethod === PaymentMethod.EFECTIVO) {
      await getOrCreateRegister(tx);
      await tx.cashRegister.update({
        where: { id: CASH_REGISTER_ID },
        data: { currentBalance: { increment: total } },
      });
      const fresh = await tx.cashRegister.findUnique({ where: { id: CASH_REGISTER_ID } });
      const balanceAfter = Number(fresh!.currentBalance);
      const balanceBefore = balanceAfter - total;

      await tx.cashMovement.create({
        data: {
          type: CashMovementType.SALE_IN,
          amount: total,
          balanceBefore,
          balanceAfter,
          saleId: sale.id,
          userId,
        },
      });
    }

    return tx.sale.findUnique({ where: { id: sale.id }, include: SALE_INCLUDE });
  });
}

function buildWhere(query: ListSalesQuery): Prisma.SaleWhereInput {
  const where: Prisma.SaleWhereInput = {};
  if (query.userId) where.userId = query.userId;
  if (query.paymentMethod) where.paymentMethod = query.paymentMethod;
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) where.createdAt.lte = new Date(query.to);
  }
  return where;
}

export async function listSales(query: ListSalesQuery) {
  const where = buildWhere(query);
  const pagination = parsePagination(query);

  const [items, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: SALE_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.sale.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}

export async function getSale(id: string) {
  const sale = await prisma.sale.findUnique({ where: { id }, include: SALE_INCLUDE });
  if (!sale) throw ApiError.notFound("Venta no encontrada");
  return sale;
}

export async function getSalesSummary(query: SalesSummaryQuery) {
  const from = query.from ? new Date(query.from) : startOfDay(new Date());
  const to = query.to ? new Date(query.to) : new Date();

  const where: Prisma.SaleWhereInput = { createdAt: { gte: from, lte: to }, status: SaleStatus.COMPLETED };
  if (query.userId) where.userId = query.userId;

  const [aggregate, grouped] = await Promise.all([
    prisma.sale.aggregate({ where, _sum: { total: true }, _count: true }),
    prisma.sale.groupBy({ by: ["paymentMethod"], where, _sum: { total: true }, _count: true }),
  ]);

  return {
    total: Number(aggregate._sum.total ?? 0),
    count: aggregate._count,
    byPaymentMethod: grouped.map((g) => ({
      paymentMethod: g.paymentMethod,
      total: Number(g._sum.total ?? 0),
      count: g._count,
    })),
  };
}
