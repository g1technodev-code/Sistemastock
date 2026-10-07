import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import type { UpsertSupplierInput } from "../schemas/supplier.schema";

export async function listSuppliers(localId: string | null | undefined, includeInactive = true) {
  return prisma.supplier.findMany({
    where: {
      ...(localId ? { localId } : {}),
      ...(includeInactive ? {} : { isActive: true }),
    },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createSupplier(localId: string | null | undefined, input: UpsertSupplierInput) {
  if (!localId) throw ApiError.badRequest("Debe estar asociado a un local");
  return prisma.supplier.create({ data: { ...input, email: input.email || null, localId } });
}


export async function updateSupplier(localId: string | null | undefined, id: string, input: UpsertSupplierInput) {
  const supplier = await prisma.supplier.findFirst({
    where: { id, ...(localId ? { localId } : {}) },
  });
  if (!supplier) throw ApiError.notFound("Proveedor no encontrado");
  return prisma.supplier.update({ where: { id: supplier.id }, data: { ...input, email: input.email || null } });
}

export async function deleteSupplier(localId: string | null | undefined, id: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id, ...(localId ? { localId } : {}) },
  });
  if (!supplier) throw ApiError.notFound("Proveedor no encontrado");

  const productCount = await prisma.product.count({ where: { supplierId: id } });
  if (productCount > 0) {
    throw ApiError.conflict(
      `No se puede eliminar: tiene ${productCount} producto(s) asociado(s). Desactívalo en su lugar.`,
    );
  }

  await prisma.supplier.delete({ where: { id: supplier.id } });
}

import { SupplierMovementType, CashMovementType } from "@prisma/client";
import { getOrCreateRegister } from "./cash.service";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import type { SupplierPaymentInput, ListSupplierMovementsQuery } from "../schemas/supplier.schema";

const MOVEMENT_INCLUDE = {
  purchase: { select: { id: true, total: true, createdAt: true, receiptNumber: true } },
};

export async function getSupplierAccount(localId: string | null | undefined, id: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id, ...(localId ? { localId } : {}) },
    include: {
      movements: {
        include: MOVEMENT_INCLUDE,
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
  if (!supplier) throw ApiError.notFound("Proveedor no encontrado");
  return supplier;
}

export async function listSupplierMovements(localId: string | null | undefined, id: string, query: ListSupplierMovementsQuery) {
  const pagination = parsePagination(query);
  const where = { supplierId: id, supplier: { ...(localId ? { localId } : {}) } };

  const [items, total] = await Promise.all([
    prisma.supplierMovement.findMany({
      where,
      include: MOVEMENT_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.supplierMovement.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}

export async function registerPayment(localId: string | null | undefined, supplierId: string, input: SupplierPaymentInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.findFirst({
      where: { id: supplierId, ...(localId ? { localId } : {}) },
    });
    if (!supplier) throw ApiError.notFound("Proveedor no encontrado");
    if (!supplier.isActive) throw ApiError.badRequest("El proveedor está inactivo");

    await tx.supplier.update({
      where: { id: supplierId },
      data: { currentBalance: { decrement: input.amount } },
    });

    const freshSupplier = await tx.supplier.findUnique({ where: { id: supplierId } });
    const balanceAfter = Number(freshSupplier!.currentBalance);
    const balanceBefore = balanceAfter + input.amount;

    const movement = await tx.supplierMovement.create({
      data: {
        supplierId,
        type: SupplierMovementType.PAYMENT,
        amount: input.amount,
        balanceBefore,
        balanceAfter,
        userId,
        note: input.note || `Pago a cuenta con ${input.paymentMethod}`,
      },
      include: MOVEMENT_INCLUDE,
    });

    if (input.paymentMethod === "EFECTIVO") {
      const register = await getOrCreateRegister(tx, supplier.localId);
      await tx.cashRegister.update({
        where: { id: register.id },
        data: { currentBalance: { decrement: input.amount } },
      });

      const freshRegister = await tx.cashRegister.findUnique({ where: { id: register.id } });
      const cashBalanceAfter = Number(freshRegister!.currentBalance);
      const cashBalanceBefore = cashBalanceAfter + input.amount;

      await tx.cashMovement.create({
        data: {
          localId: supplier.localId,
          type: CashMovementType.SUPPLIER_PAYMENT,
          amount: input.amount,
          balanceBefore: cashBalanceBefore,
          balanceAfter: cashBalanceAfter,
          userId,
          note: `Pago a proveedor ${supplier.name}`,
        },
      });
    }

    return movement;
  });
}
