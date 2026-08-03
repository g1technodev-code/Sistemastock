import { Prisma, MovementType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import type { CreateMovementInput, ListMovementsQuery } from "../schemas/stock.schema";

const MOVEMENT_INCLUDE = {
  product: { select: { id: true, sku: true, name: true, unit: true } },
  user: { select: { id: true, name: true } },
};

/**
 * ADJUSTMENT's `quantity` is the absolute recounted stock level (e.g. after a
 * physical inventory count), not a delta — unlike IN/OUT which add/remove units.
 */
export async function createMovement(input: CreateMovementInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product) throw ApiError.notFound("Producto no encontrado");

    let quantityAfter: number;
    let quantityBefore: number;
    let movementQuantity = input.quantity;

    if (input.type === MovementType.OUT) {
      // Atomic conditional update: avoids the read-then-write race where two concurrent
      // OUT requests could both pass a stale stock check and drive stock negative.
      const result = await tx.product.updateMany({
        where: { id: input.productId, currentStock: { gte: input.quantity } },
        data: { currentStock: { decrement: input.quantity } },
      });
      if (result.count === 0) {
        const fresh = await tx.product.findUnique({ where: { id: input.productId } });
        throw ApiError.badRequest(
          `Stock insuficiente. Disponible: ${fresh?.currentStock ?? product.currentStock}, solicitado: ${input.quantity}`,
        );
      }
      // Re-read after the write (same transaction sees its own write) rather than trusting
      // the pre-write snapshot above, which could be stale under concurrent movements on
      // this same product and would otherwise corrupt the quantityBefore/After audit trail
      // even though the atomic decrement itself stays correct.
      const fresh = await tx.product.findUnique({ where: { id: input.productId } });
      quantityAfter = fresh!.currentStock;
      quantityBefore = quantityAfter + input.quantity;
    } else if (input.type === MovementType.IN) {
      await tx.product.update({
        where: { id: input.productId },
        data: { currentStock: { increment: input.quantity } },
      });
      const fresh = await tx.product.findUnique({ where: { id: input.productId } });
      quantityAfter = fresh!.currentStock;
      quantityBefore = quantityAfter - input.quantity;
    } else {
      // ADJUSTMENT: set stock to the given absolute value.
      quantityBefore = product.currentStock;
      quantityAfter = input.quantity;
      movementQuantity = Math.abs(input.quantity - product.currentStock);
      await tx.product.update({ where: { id: input.productId }, data: { currentStock: quantityAfter } });
    }

    return tx.stockMovement.create({
      data: {
        productId: input.productId,
        type: input.type,
        quantity: movementQuantity,
        quantityBefore,
        quantityAfter,
        unitCost: input.type === MovementType.IN ? product.costPrice : null,
        reason: input.reason || null,
        reference: input.reference || null,
        userId,
      },
      include: MOVEMENT_INCLUDE,
    });
  });
}

function buildWhere(query: ListMovementsQuery): Prisma.StockMovementWhereInput {
  const where: Prisma.StockMovementWhereInput = {};
  if (query.productId) where.productId = query.productId;
  if (query.type) where.type = query.type;
  if (query.userId) where.userId = query.userId;
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) where.createdAt.lte = new Date(query.to);
  }
  return where;
}

export async function listMovements(query: ListMovementsQuery) {
  const where = buildWhere(query);
  const pagination = parsePagination(query);

  const [items, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: MOVEMENT_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}
