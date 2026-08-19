import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import type { UpsertCategoryInput } from "../schemas/category.schema";

export async function listCategories(localId: string | null | undefined, includeInactive = true) {
  return prisma.category.findMany({
    where: {
      ...(localId ? { localId } : {}),
      ...(includeInactive ? {} : { isActive: true }),
    },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(localId: string | null | undefined, input: UpsertCategoryInput) {
  if (!localId) throw ApiError.badRequest("Debe estar asociado a un local");
  const existing = await prisma.category.findUnique({
    where: { localId_name: { localId, name: input.name } },
  });
  if (existing) throw ApiError.conflict("Ya existe una categoría con ese nombre en tu negocio");
  return prisma.category.create({ data: { ...input, localId } });
}


export async function updateCategory(localId: string | null | undefined, id: string, input: UpsertCategoryInput) {
  const category = await prisma.category.findFirst({
    where: { id, ...(localId ? { localId } : {}) },
  });
  if (!category) throw ApiError.notFound("Categoría no encontrada");
  return prisma.category.update({ where: { id: category.id }, data: input });
}

export async function deleteCategory(localId: string | null | undefined, id: string) {
  const category = await prisma.category.findFirst({
    where: { id, ...(localId ? { localId } : {}) },
  });
  if (!category) throw ApiError.notFound("Categoría no encontrada");

  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw ApiError.conflict(
      `No se puede eliminar: tiene ${productCount} producto(s) asociado(s). Desactívala en su lugar.`,
    );
  }

  await prisma.category.delete({ where: { id: category.id } });
}
