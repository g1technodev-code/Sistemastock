import { Prisma, PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import { createPurchase } from "./purchase.service";
import type {
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  ListPurchaseOrdersQuery,
  ReceivePurchaseOrderInput,
} from "../schemas/purchaseOrder.schema";

const PO_INCLUDE = {
  items: { include: { product: { select: { id: true, sku: true, name: true, unit: true } } } },
  supplier: { select: { id: true, name: true } },
};

export async function createPurchaseOrder(localId: string | null | undefined, input: CreatePurchaseOrderInput, userId: string) {
  if (!localId) throw ApiError.badRequest("Debe estar asociado a un local");
  
  return prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.findFirst({ where: { id: input.supplierId, localId } });
    if (!supplier) throw ApiError.notFound("Proveedor no encontrado");

    let estimatedTotal = 0;
    const itemsData = [];

    for (const line of input.items) {
      const product = await tx.product.findUnique({ where: { id: line.productId } });
      if (!product) throw ApiError.notFound(`Producto no encontrado: ${line.productId}`);
      const subtotal = Math.round(line.estimatedUnitPrice * line.quantity * 100) / 100;
      estimatedTotal += subtotal;
      itemsData.push({
        productId: line.productId,
        quantity: line.quantity,
        estimatedUnitPrice: line.estimatedUnitPrice,
      });
    }

    const po = await tx.purchaseOrder.create({
      data: {
        localId,
        supplierId: input.supplierId,
        createdById: userId,
        notes: input.notes?.trim() || null,
        estimatedTotal: Math.round(estimatedTotal * 100) / 100,
        items: { create: itemsData },
      },
      include: PO_INCLUDE,
    });

    return po;
  });
}

export async function updatePurchaseOrder(localId: string | null | undefined, id: string, input: UpdatePurchaseOrderInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.purchaseOrder.findFirst({ where: { id, ...(localId ? { localId } : {}) } });
    if (!existing) throw ApiError.notFound("Pedido no encontrado");
    if (existing.status !== PurchaseOrderStatus.PENDING) {
      throw ApiError.badRequest("Solo se pueden editar pedidos pendientes");
    }

    const supplier = await tx.supplier.findFirst({ where: { id: input.supplierId, ...(localId ? { localId } : {}) } });
    if (!supplier) throw ApiError.notFound("Proveedor no encontrado");

    let estimatedTotal = 0;
    const itemsData = [];

    for (const line of input.items) {
      const product = await tx.product.findUnique({ where: { id: line.productId } });
      if (!product) throw ApiError.notFound(`Producto no encontrado: ${line.productId}`);
      const subtotal = Math.round(line.estimatedUnitPrice * line.quantity * 100) / 100;
      estimatedTotal += subtotal;
      itemsData.push({
        productId: line.productId,
        quantity: line.quantity,
        estimatedUnitPrice: line.estimatedUnitPrice,
      });
    }

    await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
    await tx.purchaseOrder.update({
      where: { id },
      data: {
        supplierId: input.supplierId,
        notes: input.notes?.trim() || null,
        estimatedTotal: Math.round(estimatedTotal * 100) / 100,
        items: { create: itemsData },
      },
    });

    return tx.purchaseOrder.findUnique({ where: { id }, include: PO_INCLUDE });
  });
}

export async function listPurchaseOrders(localId: string | null | undefined, query: ListPurchaseOrdersQuery) {
  const pagination = parsePagination(query);
  const where: Prisma.PurchaseOrderWhereInput = {
    ...(localId ? { localId } : {}),
    ...(query.supplierId ? { supplierId: query.supplierId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) where.createdAt.lte = new Date(query.to);
  }

  const [items, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: PO_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}

export async function getPurchaseOrder(localId: string | null | undefined, id: string) {
  const po = await prisma.purchaseOrder.findFirst({
    where: { id, ...(localId ? { localId } : {}) },
    include: PO_INCLUDE,
  });
  if (!po) throw ApiError.notFound("Pedido no encontrado");
  return po;
}

export async function receivePurchaseOrder(localId: string | null | undefined, id: string, input: ReceivePurchaseOrderInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findFirst({
      where: { id, ...(localId ? { localId } : {}) },
      include: { items: true },
    });
    if (!po) throw ApiError.notFound("Pedido no encontrado");
    if (po.status !== PurchaseOrderStatus.PENDING && po.status !== PurchaseOrderStatus.PARTIALLY_RECEIVED) {
      throw ApiError.badRequest("El pedido ya está recibido o cancelado");
    }

    const purchaseItems = [];
    for (const rItem of input.items) {
      if (rItem.receivedQuantity > 0) {
        purchaseItems.push({
          productId: rItem.productId,
          quantity: rItem.receivedQuantity,
          unitCost: rItem.actualUnitCost,
        });
      }
      
      await tx.purchaseOrderItem.updateMany({
        where: { purchaseOrderId: id, productId: rItem.productId },
        data: { receivedQuantity: { increment: rItem.receivedQuantity } },
      });
    }

    if (purchaseItems.length === 0) {
      throw ApiError.badRequest("Debe recibir al menos una unidad de un producto");
    }

    // Call createPurchase internally within the same transaction
    const purchaseInput = {
      supplierId: po.supplierId,
      purchaseOrderId: po.id,
      items: purchaseItems,
      paymentMethod: input.paymentMethod || null,
      receiptNumber: input.receiptNumber || null,
      note: input.note || `Compra generada a partir del pedido #${po.id}`,
    };

    const purchase = await createPurchase(localId, purchaseInput, userId, tx);

    // Check if fully received
    const updatedPo = await tx.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    
    const isFullyReceived = updatedPo!.items.every((item) => item.receivedQuantity >= item.quantity);
    
    await tx.purchaseOrder.update({
      where: { id },
      data: {
        status: isFullyReceived ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.PARTIALLY_RECEIVED,
        receivedAt: isFullyReceived ? new Date() : null,
      },
    });

    return purchase;
  });
}
