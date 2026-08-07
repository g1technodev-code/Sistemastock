import { Prisma, MovementType, InventoryCountStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import type { CreateInventoryCountInput, ListInventoryCountsQuery, UpsertItemInput } from "../schemas/inventoryCount.schema";

const COUNT_INCLUDE = {
  items: {
    include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
    orderBy: { countedAt: "asc" as const },
  },
  startedBy: { select: { id: true, name: true } },
  completedBy: { select: { id: true, name: true } },
};

export async function createSession(localId: string | null | undefined, input: CreateInventoryCountInput, userId: string) {
  if (!localId) throw ApiError.badRequest("Debe estar asociado a un local");
  return prisma.inventoryCount.create({
    data: { localId, note: input.note?.trim() || null, startedById: userId },
    include: COUNT_INCLUDE,
  });
}


export async function upsertItem(sessionId: string, input: UpsertItemInput) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.inventoryCount.findUnique({ where: { id: sessionId } });
    if (!session) throw ApiError.notFound("Sesión de inventario no encontrada");
    if (session.status !== InventoryCountStatus.OPEN) {
      throw ApiError.badRequest("Solo se pueden cargar conteos en una sesión abierta");
    }
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product) throw ApiError.notFound("Producto no encontrado");

    // System quantity is snapshotted at count time, not at confirm time, so the
    // counter sees the same "expected" number a warehouse worker would see on the shelf tag.
    const systemQuantity = product.currentStock;
    const difference = input.countedQuantity - systemQuantity;

    await tx.inventoryCountItem.upsert({
      where: { inventoryCountId_productId: { inventoryCountId: sessionId, productId: input.productId } },
      update: { systemQuantity, countedQuantity: input.countedQuantity, difference, countedAt: new Date() },
      create: {
        inventoryCountId: sessionId,
        productId: input.productId,
        systemQuantity,
        countedQuantity: input.countedQuantity,
        difference,
      },
    });

    return tx.inventoryCount.findUnique({ where: { id: sessionId }, include: COUNT_INCLUDE });
  });
}

export async function removeItem(sessionId: string, productId: string) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.inventoryCount.findUnique({ where: { id: sessionId } });
    if (!session) throw ApiError.notFound("Sesión de inventario no encontrada");
    if (session.status !== InventoryCountStatus.OPEN) {
      throw ApiError.badRequest("Solo se pueden editar sesiones abiertas");
    }

    await tx.inventoryCountItem.deleteMany({ where: { inventoryCountId: sessionId, productId } });
    return tx.inventoryCount.findUnique({ where: { id: sessionId }, include: COUNT_INCLUDE });
  });
}

function buildWhere(query: ListInventoryCountsQuery): Prisma.InventoryCountWhereInput {
  const where: Prisma.InventoryCountWhereInput = {};
  if (query.status) where.status = query.status;
  return where;
}

export async function listSessions(query: ListInventoryCountsQuery) {
  const where = buildWhere(query);
  const pagination = parsePagination(query);

  const [items, total] = await Promise.all([
    prisma.inventoryCount.findMany({
      where,
      include: COUNT_INCLUDE,
      orderBy: { startedAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.inventoryCount.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}

export async function getSession(id: string) {
  const session = await prisma.inventoryCount.findUnique({ where: { id }, include: COUNT_INCLUDE });
  if (!session) throw ApiError.notFound("Sesión de inventario no encontrada");
  return session;
}

export async function confirmSession(sessionId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.inventoryCount.findUnique({ where: { id: sessionId }, include: { items: true } });
    if (!session) throw ApiError.notFound("Sesión de inventario no encontrada");
    if (session.status !== InventoryCountStatus.OPEN) {
      throw ApiError.badRequest("La sesión ya fue confirmada");
    }
    if (session.items.length === 0) {
      throw ApiError.badRequest("Agrega al menos un producto contado antes de confirmar");
    }

    // Stable productId order so concurrent confirmations sharing a product always
    // acquire row locks in the same order — same deadlock-avoidance pattern as sale/purchase.
    const sortedItems = [...session.items].filter((it) => it.difference !== 0).sort((a, b) => a.productId.localeCompare(b.productId));

    for (const item of sortedItems) {
      // Re-read current stock instead of trusting the count-time snapshot: stock may have
      // moved (sales, other adjustments) since this line was counted. The recount's
      // countedQuantity is still the absolute target — same ADJUSTMENT semantics as
      // stock.service.ts — but quantityBefore must reflect reality at confirm time.
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;
      const quantityBefore = product.currentStock;
      const quantityAfter = item.countedQuantity;
      const movementQuantity = Math.abs(quantityAfter - quantityBefore);
      if (movementQuantity === 0) continue;

      await tx.product.update({ where: { id: item.productId }, data: { currentStock: quantityAfter } });
      await tx.stockMovement.create({
        data: {
          localId: session.localId,
          productId: item.productId,
          type: MovementType.ADJUSTMENT,
          quantity: movementQuantity,
          quantityBefore,
          quantityAfter,
          reason: "Ajuste por conteo físico",
          reference: `inventory-count:${session.id}`,
          userId,
        },
      });

    }

    return tx.inventoryCount.update({
      where: { id: sessionId },
      data: { status: InventoryCountStatus.COMPLETED, completedById: userId, completedAt: new Date() },
      include: COUNT_INCLUDE,
    });
  });
}
