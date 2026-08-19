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


export async function updateProduct(id: string, input: UpsertProductInput) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw ApiError.notFound("Producto no encontrado");

  if (input.sku !== product.sku) {
    const skuTaken = await prisma.product.findUnique({
      where: { localId_sku: { localId: product.localId, sku: input.sku } },
    });
    if (skuTaken) throw ApiError.conflict("Ya existe un producto con ese SKU en tu negocio");
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

export async function lookupBarcode(barcode: string): Promise<{
  found: boolean;
  name?: string;
  description?: string;
}> {
  if (!barcode || barcode.length < 4) {
    return { found: false };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    // 1. Try Open Food Facts API (excellent for food, beverages, and LATAM retail)
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`, {
      signal: controller.signal,
      headers: { "User-Agent": "KipoStockFlow - WebApp - Version 1.0" },
    });

    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.status === 1 && data.product) {
        const name = data.product.product_name_es || data.product.product_name || "";
        const brand = data.product.brands ? ` - ${data.product.brands}` : "";
        const description = data.product.generic_name_es || data.product.generic_name || data.product.categories || "";

        if (name) {
          clearTimeout(timeoutId);
          return {
            found: true,
            name: `${name}${brand}`.trim(),
            description: description.trim(),
          };
        }
      }
    }
  } catch (error) {
    console.warn(`[Barcode Lookup OpenFoodFacts] Timeout or error for ${barcode}`);
  } finally {
    clearTimeout(timeoutId);
  }

  // 2. Fallback: UPCitemdb Trial API for general goods
  const fallbackController = new AbortController();
  const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 2500);

  try {
    const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`, {
      signal: fallbackController.signal,
    });

    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        clearTimeout(fallbackTimeoutId);
        return {
          found: true,
          name: item.title || "",
          description: item.description || item.brand || "",
        };
      }
    }

  } catch (error) {
    console.warn(`[Barcode Lookup UPCitemdb] Timeout or error for ${barcode}`);
  } finally {
    clearTimeout(fallbackTimeoutId);
  }

  return { found: false };
}

