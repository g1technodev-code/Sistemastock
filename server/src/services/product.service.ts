import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import type { ListProductsQuery, UpsertProductInput } from "../schemas/product.schema";

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true, color: true } },
  supplier: { select: { id: true, name: true } },
};

function buildWhere(query: ListProductsQuery): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

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

export async function listProducts(query: ListProductsQuery) {
  const where = buildWhere(query);

  // Prisma cannot compare two columns of the same row in a `where` clause, so the
  // low-stock filter (currentStock <= minStock) is applied in-memory after fetching
  // the filtered set. Fine at SME scale (hundreds/low-thousands of products).
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

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
  if (!product) throw ApiError.notFound("Producto no encontrado");
  return product;
}

export async function createProduct(input: UpsertProductInput) {
  const existing = await prisma.product.findUnique({ where: { sku: input.sku } });
  if (existing) throw ApiError.conflict("Ya existe un producto con ese SKU");

  return prisma.product.create({
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
    },
    include: PRODUCT_INCLUDE,
  });
}

export async function updateProduct(id: string, input: UpsertProductInput) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw ApiError.notFound("Producto no encontrado");

  if (input.sku !== product.sku) {
    const skuTaken = await prisma.product.findUnique({ where: { sku: input.sku } });
    if (skuTaken) throw ApiError.conflict("Ya existe un producto con ese SKU");
  }

  return prisma.product.update({
    where: { id },
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

export async function deleteProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw ApiError.notFound("Producto no encontrado");

  const movementCount = await prisma.stockMovement.count({ where: { productId: id } });
  if (movementCount > 0) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return { softDeleted: true };
  }

  await prisma.product.delete({ where: { id } });
  return { softDeleted: false };
}
