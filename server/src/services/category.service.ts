import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import type { UpsertCategoryInput } from "../schemas/category.schema";

export async function listCategories(includeInactive = true) {
  return prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(input: UpsertCategoryInput) {
  const existing = await prisma.category.findUnique({ where: { name: input.name } });
  if (existing) throw ApiError.conflict("Ya existe una categoría con ese nombre");
  return prisma.category.create({ data: input });
}

export async function updateCategory(id: string, input: UpsertCategoryInput) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound("Categoría no encontrada");
  return prisma.category.update({ where: { id }, data: input });
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound("Categoría no encontrada");

  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw ApiError.conflict(
      `No se puede eliminar: tiene ${productCount} producto(s) asociado(s). Desactívala en su lugar.`,
    );
  }

  await prisma.category.delete({ where: { id } });
}
