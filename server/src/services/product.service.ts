import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import type { ListProductsQuery, UpsertProductInput } from "../schemas/product.schema";

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true, color: true } },
  supplier: { select: { id: true, name: true } },
};

function buildWhere(localId: string | null | undefined, query: ListProductsQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    ...(localId ? { localId } : {}),
  };

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { sku: { contains: query.q, mode: "insensitive" } },
      { barcode: { contains: query.q, mode: "insensitive" } },
    ];
  }
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.supplierId) where.supplierId = query.supplierId;
  if (query.isActive !== undefined) where.isActive = query.isActive;

  return where;
}

export async function listProducts(localId: string | null | undefined, query: ListProductsQuery) {
  const where = buildWhere(localId, query);

  if (query.lowStock) {
    const all = await prisma.product.findMany({ where, include: PRODUCT_INCLUDE, orderBy: { name: "asc" } });
    const filtered = all.filter((p) => p.currentStock <= p.minStock);
    const pagination = parsePagination(query);
    const page = filtered.slice(pagination.skip, pagination.skip + pagination.limit);
    return paginatedResponse(page, filtered.length, pagination);
  }

  const pagination = parsePagination(query);
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy: { name: "asc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.product.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}

export async function getProduct(localId: string | null | undefined, id: string) {
  const where = { id, ...(localId ? { localId } : {}) };
  const product = await prisma.product.findFirst({ where, include: PRODUCT_INCLUDE });
  if (!product) throw ApiError.notFound("Producto no encontrado");
  return product;
}

export async function createProduct(localId: string | null | undefined, input: UpsertProductInput) {
  if (!localId) throw ApiError.badRequest("Debe estar asociado a un local para crear productos");

  const existing = await prisma.product.findUnique({
    where: { localId_sku: { localId, sku: input.sku } },
  });
  if (existing) throw ApiError.conflict("Ya existe un producto con ese SKU en tu negocio");

  return prisma.product.create({
    data: {
      localId,
      sku: input.sku,
      barcode: input.barcode || null,
      name: input.name,
      description: input.description || null,
      unit: input.unit,
      costPrice: input.costPrice,
      sellPrice: input.sellPrice,
      minStock: input.minStock,
      imageUrl: input.imageUrl || null,
      categoryId: input.categoryId || null,
      supplierId: input.supplierId || null,
    },
    include: PRODUCT_INCLUDE,
  });
}


export async function updateProduct(localId: string | null | undefined, id: string, input: UpsertProductInput) {
  const product = await prisma.product.findFirst({
    where: { id, ...(localId ? { localId } : {}) },
  });
  if (!product) throw ApiError.notFound("Producto no encontrado");

  if (input.sku !== product.sku) {
    const skuTaken = await prisma.product.findUnique({
      where: { localId_sku: { localId: product.localId, sku: input.sku } },
    });
    if (skuTaken) throw ApiError.conflict("Ya existe un producto con ese SKU en tu negocio");
  }


  return prisma.product.update({
    where: { id: product.id },
    data: {
      sku: input.sku,
      barcode: input.barcode || null,
      name: input.name,
      description: input.description || null,
      unit: input.unit,
      costPrice: input.costPrice,
      sellPrice: input.sellPrice,
      minStock: input.minStock,
      imageUrl: input.imageUrl || null,
      categoryId: input.categoryId || null,
      supplierId: input.supplierId || null,
      isActive: input.isActive,
    },
    include: PRODUCT_INCLUDE,
  });
}

export async function deleteProduct(localId: string | null | undefined, id: string) {
  const product = await prisma.product.findFirst({
    where: { id, ...(localId ? { localId } : {}) },
  });
  if (!product) throw ApiError.notFound("Producto no encontrado");

  const movementCount = await prisma.stockMovement.count({ where: { productId: id } });
  if (movementCount > 0) {
    await prisma.product.update({ where: { id: product.id }, data: { isActive: false } });
    return { softDeleted: true };
  }

  await prisma.product.delete({ where: { id: product.id } });
  return { softDeleted: false };
}
