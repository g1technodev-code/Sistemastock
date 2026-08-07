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


export async function updateSupplier(id: string, input: UpsertSupplierInput) {
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) throw ApiError.notFound("Proveedor no encontrado");
  return prisma.supplier.update({ where: { id }, data: { ...input, email: input.email || null } });
}

export async function deleteSupplier(id: string) {
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) throw ApiError.notFound("Proveedor no encontrado");

  const productCount = await prisma.product.count({ where: { supplierId: id } });
  if (productCount > 0) {
    throw ApiError.conflict(
      `No se puede eliminar: tiene ${productCount} producto(s) asociado(s). Desactívalo en su lugar.`,
    );
  }

  await prisma.supplier.delete({ where: { id } });
}
