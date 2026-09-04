import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import type { UpsertRubroInput } from "../schemas/rubro.schema";

export async function listRubros(includeInactive = true) {
  return prisma.rubro.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createRubro(input: UpsertRubroInput) {
  return prisma.rubro.create({ data: input });
}

export async function updateRubro(id: string, input: UpsertRubroInput) {
  const rubro = await prisma.rubro.findUnique({ where: { id } });
  if (!rubro) throw ApiError.notFound("Rubro no encontrado");
  return prisma.rubro.update({ where: { id }, data: input });
}

export async function deleteRubro(id: string) {
  const rubro = await prisma.rubro.findUnique({ where: { id } });
  if (!rubro) throw ApiError.notFound("Rubro no encontrado");

  const [localCount, catalogProductCount] = await Promise.all([
    prisma.local.count({ where: { rubroId: id } }),
    prisma.catalogProduct.count({ where: { rubroId: id } }),
  ]);

  if (localCount > 0 || catalogProductCount > 0) {
    throw ApiError.conflict(
      `No se puede eliminar: ${localCount} local(es) y ${catalogProductCount} producto(s) de catálogo están usando este rubro. Desactívalo en su lugar.`,
    );
  }

  await prisma.rubro.delete({ where: { id } });
}
