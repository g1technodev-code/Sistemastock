import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import { createProduct } from "./product.service";
import type { UpsertCatalogProductInput, BulkCatalogProductRow } from "../schemas/catalogProduct.schema";

export async function listCatalogProducts(includeInactive = true) {
  return prisma.catalogProduct.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function createCatalogProduct(input: UpsertCatalogProductInput) {
  return prisma.catalogProduct.create({ data: input });
}

export async function updateCatalogProduct(id: string, input: UpsertCatalogProductInput) {
  const catalogProduct = await prisma.catalogProduct.findUnique({ where: { id } });
  if (!catalogProduct) throw ApiError.notFound("Producto de catálogo no encontrado");

  return prisma.catalogProduct.update({ where: { id }, data: input });
}

export async function deleteCatalogProduct(id: string) {
  const catalogProduct = await prisma.catalogProduct.findUnique({ where: { id } });
  if (!catalogProduct) throw ApiError.notFound("Producto de catálogo no encontrado");

  await prisma.catalogProduct.delete({ where: { id } });
}

/** Local-facing: the shared kiosco catalog (active products only). */
export async function browseCatalogForLocal(localId: string | null | undefined) {
  if (!localId) return [];

  return prisma.catalogProduct.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

/** Turns a CatalogProduct into a real, per-Local Product (SKU auto-assigned by createProduct). */
export async function importCatalogProduct(
  localId: string | null | undefined,
  catalogProductId: string,
  input: { categoryId?: string | null },
) {
  if (!localId) throw ApiError.badRequest("Debe estar asociado a un local para importar productos");

  const catalogProduct = await prisma.catalogProduct.findUnique({ where: { id: catalogProductId } });
  if (!catalogProduct || !catalogProduct.isActive) throw ApiError.notFound("Producto de catálogo no encontrado");

  return createProduct(localId, {
    barcode: catalogProduct.barcode ?? undefined,
    name: catalogProduct.name,
    description: catalogProduct.description ?? undefined,
    unit: catalogProduct.unit,
    costPrice: 0,
    sellPrice: 0,
    minStock: 0,
    imageUrl: catalogProduct.imageUrl ?? undefined,
    categoryId: input.categoryId ?? null,
    supplierId: null,
  });
}

export type BulkCatalogProductResult = {
  row: number;
  success: boolean;
  error?: string;
  catalogProduct?: Awaited<ReturnType<typeof createCatalogProduct>>;
};

/** Creates each row via createCatalogProduct. */
export async function bulkCreateCatalogProducts(items: BulkCatalogProductRow[]): Promise<BulkCatalogProductResult[]> {
  const results: BulkCatalogProductResult[] = [];

  for (let i = 0; i < items.length; i++) {
    const row = items[i];
    try {
      const catalogProduct = await createCatalogProduct({
        name: row.name,
        description: row.description || null,
        barcode: row.barcode || null,
        unit: "unidad",
      });
      results.push({ row: i, success: true, catalogProduct });
    } catch (error) {
      results.push({ row: i, success: false, error: error instanceof ApiError ? error.message : "Error inesperado" });
    }
  }

  return results;
}
