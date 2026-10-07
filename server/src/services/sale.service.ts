import { Prisma, MovementType, PaymentMethod, SaleStatus, CashMovementType, CashShiftStatus, CustomerMovementType, NotificationType, SaleType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import { getOrCreateRegister, CASH_REGISTER_ID } from "./cash.service";
import { createNotification } from "./notification.service";
import type { CreateSaleInput, ListSalesQuery, SalesSummaryQuery } from "../schemas/sale.schema";

const SALE_INCLUDE = {
  items: { include: { product: { select: { id: true, sku: true, name: true, unit: true } } } },
  payments: true,
  user: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true, taxId: true, currentBalance: true } },
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
  productName: string;
  minStock: number;
};

export async function createSale(localId: string | null | undefined, input: CreateSaleInput, userId: string) {
  if (!localId) throw ApiError.badRequest("Debe estar asociado a un local");
  return prisma.$transaction(async (tx) => {
    const openShift = await tx.cashShift.findFirst({
      where: { localId, openedById: userId, status: CashShiftStatus.OPEN },
    });
    if (!openShift) {
      throw ApiError.badRequest("Debes abrir tu turno de caja antes de registrar ventas");
    }

    let isCC = input.paymentMethod === PaymentMethod.CUENTA_CORRIENTE;
    if (input.paymentMethod === PaymentMethod.MIXTO && input.splitPayments?.some(p => p.method === PaymentMethod.CUENTA_CORRIENTE && p.amount > 0)) {
      isCC = true;
    }
    if (isCC) {
      if (!input.customerId) throw ApiError.badRequest("Debes seleccionar un cliente para vender a Cuenta Corriente");
      const customer = await tx.customer.findFirst({ where: { id: input.customerId, localId } });
      if (!customer) throw ApiError.notFound("Cliente no encontrado");
      if (!customer.isActive) throw ApiError.badRequest("El cliente se encuentra inactivo");
    }

    const sortedItems = [...input.items].sort((a, b) => a.productId.localeCompare(b.productId));

    let total = 0;
    const saleItemsData: { productId: string; quantity: number; unitPrice: number; subtotal: number; saleType: SaleType }[] = [];
    const pendingMovements: PendingMovement[] = [];

    for (const line of sortedItems) {
      const product = await tx.product.findFirst({ where: { id: line.productId, localId } });
      if (!product) throw ApiError.notFound(`Producto no encontrado: ${line.productId}`);
      if (!product.isActive) throw ApiError.badRequest(`El producto "${product.name}" no está activo`);

      let lineQuantity = 0;
      let unitPrice = 0;
      let lineSubtotal = 0;
      let shouldDiscountStock = true;

      if (product.saleType === "UNIT") {
        if (line.quantity === undefined || line.quantity <= 0) throw ApiError.badRequest(`Cantidad inválida para "${product.name}"`);
        lineQuantity = line.quantity;
        unitPrice = Number(product.sellPrice);
        lineSubtotal = unitPrice * lineQuantity;
      } else if (product.saleType === "WEIGHT") {
        if (line.quantity === undefined || line.quantity <= 0) throw ApiError.badRequest(`Peso inválido para "${product.name}"`);
        lineQuantity = line.quantity; // Grams
        unitPrice = Number(product.sellPrice); // Price per kg
        lineSubtotal = (unitPrice / 1000) * lineQuantity;
      } else if (product.saleType === "AMOUNT") {
        if (line.amount === undefined || line.amount <= 0) throw ApiError.badRequest(`Importe inválido para "${product.name}"`);
        lineQuantity = 1;
        unitPrice = line.amount;
        lineSubtotal = line.amount;
        shouldDiscountStock = false;
      }

      if (shouldDiscountStock) {
        const result = await tx.product.updateMany({
          where: { id: line.productId, localId, currentStock: { gte: lineQuantity } },
          data: { currentStock: { decrement: lineQuantity } },
        });
        if (result.count === 0) {
          const fresh = await tx.product.findUnique({ where: { id: line.productId } });
          throw ApiError.badRequest(
            `Stock insuficiente para "${product.name}". Disponible: ${fresh?.currentStock ?? product.currentStock}, solicitado: ${lineQuantity}`
          );
        }

        const fresh = await tx.product.findUnique({ where: { id: line.productId } });
        const quantityAfter = fresh!.currentStock;
        const quantityBefore = quantityAfter + lineQuantity;

        pendingMovements.push({
          productId: line.productId,
          quantity: lineQuantity,
          quantityBefore,
          quantityAfter,
          unitCost: product.costPrice,
          productName: product.name,
          minStock: product.minStock,
        });
      }

      total += lineSubtotal;
      saleItemsData.push({
        productId: line.productId,
        quantity: lineQuantity,
        unitPrice,
        subtotal: lineSubtotal,
        saleType: product.saleType,
      });
    }

    let ccAmount = 0;
    if (input.paymentMethod === PaymentMethod.CUENTA_CORRIENTE) {
      ccAmount = total;
    } else if (input.paymentMethod === PaymentMethod.MIXTO && input.splitPayments) {
      ccAmount = input.splitPayments.find(p => p.method === PaymentMethod.CUENTA_CORRIENTE)?.amount || 0;
    }

    if (ccAmount > 0 && input.customerId) {
      const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
      if (customer && customer.creditLimit !== null) {
        const potentialBalance = Number(customer.currentBalance) + ccAmount;
        if (potentialBalance > Number(customer.creditLimit)) {
          throw ApiError.badRequest(
            `El saldo total ($${potentialBalance}) supera el límite de crédito permitido ($${customer.creditLimit}) para ${customer.name}`,
          );
        }
      }
    }

    const sale = await tx.sale.create({
      data: {
        localId,
        total,
        paymentMethod: input.paymentMethod,
        userId,
        customerId: input.customerId || null,
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
          saleType: item.saleType,
        },
      });
    }

    if (input.paymentMethod === PaymentMethod.MIXTO && input.splitPayments) {
      const splitTotal = input.splitPayments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(splitTotal - total) > 0.01) {
        throw ApiError.badRequest(`La suma de los pagos mixtos ($${splitTotal}) no coincide con el total de la venta ($${total})`);
      }
      for (const p of input.splitPayments) {
        if (p.amount > 0) {
          await tx.salePayment.create({
            data: { saleId: sale.id, paymentMethod: p.method, amount: p.amount }
          });
        }
      }
    }

    for (const movement of pendingMovements) {
      await tx.stockMovement.create({
        data: {
          localId,
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

      // Notificación automática si el stock cayó al nivel mínimo o menos
      if (movement.quantityAfter <= movement.minStock) {
        await createNotification(
          localId,
          NotificationType.LOW_STOCK,
          "Alerta de Stock Bajo",
          `El producto "${movement.productName}" tiene un stock crítico de ${movement.quantityAfter} unidades (Mínimo: ${movement.minStock}).`,
          { productId: movement.productId, currentStock: movement.quantityAfter, minStock: movement.minStock },
        );
      }

    }

    let cashAmount = 0;
    if (input.paymentMethod === PaymentMethod.EFECTIVO) {
      cashAmount = total;
    } else if (input.paymentMethod === PaymentMethod.MIXTO && input.splitPayments) {
      cashAmount = input.splitPayments.find(p => p.method === PaymentMethod.EFECTIVO)?.amount || 0;
    }

    if (cashAmount > 0) {
      const register = await getOrCreateRegister(tx, localId);
      await tx.cashRegister.update({
        where: { id: register.id },
        data: { currentBalance: { increment: cashAmount } },
      });
      const fresh = await tx.cashRegister.findUnique({ where: { id: register.id } });
      const balanceAfter = Number(fresh!.currentBalance);
      const balanceBefore = balanceAfter - cashAmount;

      await tx.cashMovement.create({
        data: {
          localId,
          type: CashMovementType.SALE_IN,
          amount: cashAmount,
          balanceBefore,
          balanceAfter,
          saleId: sale.id,
          userId,
        },
      });
    }

    if (ccAmount > 0 && input.customerId) {
      const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
      const balanceBefore = Number(customer!.currentBalance);
      const balanceAfter = balanceBefore + ccAmount;

      await tx.customer.update({
        where: { id: input.customerId },
        data: { currentBalance: balanceAfter },
      });

      await tx.customerMovement.create({
        data: {
          customerId: input.customerId,
          type: CustomerMovementType.CHARGE,
          amount: ccAmount,
          balanceBefore,
          balanceAfter,
          saleId: sale.id,
          userId,
          note: `Venta a cuenta corriente #${sale.id.slice(-6)}`,
        },
      });
    }

    return tx.sale.findUnique({ where: { id: sale.id }, include: SALE_INCLUDE });
  });
}

function buildWhere(localId: string | null | undefined, query: ListSalesQuery): Prisma.SaleWhereInput {
  const where: Prisma.SaleWhereInput = {
    ...(localId ? { localId } : {}),
  };
  if (query.userId) where.userId = query.userId;
  if (query.paymentMethod) where.paymentMethod = query.paymentMethod;
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) where.createdAt.lte = new Date(query.to);
  }
  return where;
}

export async function listSales(localId: string | null | undefined, query: ListSalesQuery) {
  const where = buildWhere(localId, query);
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

export async function getSale(localId: string | null | undefined, id: string) {
  const where = { id, ...(localId ? { localId } : {}) };
  const sale = await prisma.sale.findFirst({ where, include: SALE_INCLUDE });
  if (!sale) throw ApiError.notFound("Venta no encontrada");
  return sale;
}

export async function getSalesSummary(localId: string | null | undefined, query: SalesSummaryQuery) {
  const from = query.from ? new Date(query.from) : startOfDay(new Date());
  const to = query.to ? new Date(query.to) : new Date();

  const where: Prisma.SaleWhereInput = {
    ...(localId ? { localId } : {}),
    createdAt: { gte: from, lte: to },
    status: SaleStatus.COMPLETED,
  };
  if (query.userId) where.userId = query.userId;

  const [aggregate, grouped, mixedSales] = await Promise.all([
    prisma.sale.aggregate({ where, _sum: { total: true }, _count: true }),
    prisma.sale.groupBy({ by: ["paymentMethod"], where, _sum: { total: true }, _count: true }),
    prisma.sale.findMany({
      where: { ...where, paymentMethod: PaymentMethod.MIXTO },
      include: { payments: true }
    })
  ]);

  const methodTotals: Record<string, number> = {
    EFECTIVO: 0,
    TRANSFERENCIA: 0,
    TARJETA: 0,
    CUENTA_CORRIENTE: 0,
    MIXTO: 0
  };
  const methodCounts: Record<string, number> = {
    EFECTIVO: 0,
    TRANSFERENCIA: 0,
    TARJETA: 0,
    CUENTA_CORRIENTE: 0,
    MIXTO: 0
  };

  // Add standard grouped totals
  for (const group of grouped) {
    if (group.paymentMethod !== PaymentMethod.MIXTO) {
      methodTotals[group.paymentMethod] += Number(group._sum.total ?? 0);
      methodCounts[group.paymentMethod] += group._count;
    }
  }

  // Add mixed sales breakdown
  for (const sale of mixedSales) {
    methodCounts.MIXTO += 1;
    for (const payment of sale.payments) {
      methodTotals[payment.paymentMethod] += Number(payment.amount);
    }
  }

  return {
    total: Number(aggregate._sum.total ?? 0),
    count: aggregate._count,
    byPaymentMethod: Object.keys(methodTotals)
      .filter(m => methodTotals[m] > 0 || m === 'MIXTO')
      .map(m => ({
        paymentMethod: m as PaymentMethod,
        total: methodTotals[m],
        count: methodCounts[m]
      })),
  };
}
