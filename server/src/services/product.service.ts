import { Prisma, MovementType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import { createMovement } from "./stock.service";
import type { ListProductsQuery, UpsertProductInput, BulkProductRow } from "../schemas/product.schema";

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

/** Atomically reserves the next SKU number for a Local (P-00001, P-00002, ...). */
async function nextSku(localId: string) {
  const local = await prisma.local.update({
    where: { id: localId },
    data: { nextSkuNumber: { increment: 1 } },
    select: { nextSkuNumber: true },
  });
  return `P-${String(local.nextSkuNumber - 1).padStart(5, "0")}`;
}

export async function createProduct(localId: string | null | undefined, input: UpsertProductInput, userId?: string) {
  if (!localId) throw ApiError.badRequest("Debe estar asociado a un local para crear productos");

  const sku = await nextSku(localId);
  const initialStock = input.initialStock ?? 0;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        localId,
        sku,
        barcode: input.barcode || null,
        name: input.name,
        description: input.description || null,
        unit: input.unit,
        costPrice: input.costPrice,
        sellPrice: input.sellPrice,
        currentStock: initialStock,
        minStock: input.minStock,
        imageUrl: input.imageUrl || null,
        saleType: input.saleType || "UNIT",
        categoryId: input.categoryId || null,
        supplierId: input.supplierId || null,
      },
      include: PRODUCT_INCLUDE,
    });

    if (initialStock > 0 && userId) {
      await tx.stockMovement.create({
        data: {
          localId,
          productId: product.id,
          userId,
          type: MovementType.IN,
          quantity: initialStock,
          quantityBefore: 0,
          quantityAfter: initialStock,
          reason: "Stock inicial al crear producto",
        },
      });
    }


    return product;
  });
}



export async function updateProduct(localId: string | null | undefined, id: string, input: UpsertProductInput) {
  const product = await prisma.product.findFirst({
    where: { id, ...(localId ? { localId } : {}) },
  });
  if (!product) throw ApiError.notFound("Producto no encontrado");

  return prisma.product.update({
    where: { id: product.id },
    data: {
      barcode: input.barcode || null,
      name: input.name,
      description: input.description || null,
      unit: input.unit,
      costPrice: input.costPrice,
      sellPrice: input.sellPrice,
      minStock: input.minStock,
      currentStock: input.initialStock !== undefined ? input.initialStock : undefined,
      imageUrl: input.imageUrl || null,
      saleType: input.saleType || "UNIT",
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

  await prisma.$transaction([
    prisma.stockMovement.deleteMany({ where: { productId: product.id } }),
    prisma.saleItem.deleteMany({ where: { productId: product.id } }),
    prisma.purchaseItem.deleteMany({ where: { productId: product.id } }),
    prisma.inventoryCountItem.deleteMany({ where: { productId: product.id } }),
    prisma.product.delete({ where: { id: product.id } })
  ]);

  return { softDeleted: false };
}

export type BulkProductResult = {
  row: number;
  success: boolean;
  action?: "created" | "updated";
  error?: string;
  product?: Awaited<ReturnType<typeof createProduct>>;
};

/**
 * Finds the Local's existing product for a bulk row: by barcode when the row has one,
 * otherwise by name (case-insensitive). Ambiguous matches are rejected instead of guessed.
 */
async function findExistingForBulkRow(localId: string, row: BulkProductRow) {
  const barcode = row.barcode?.trim();
  const where: Prisma.ProductWhereInput = barcode
    ? { localId, barcode }
    : { localId, name: { equals: row.name.trim(), mode: "insensitive" } };

  const matches = await prisma.product.findMany({ where, select: { id: true }, take: 2 });
  if (matches.length > 1) {
    throw ApiError.badRequest(
      barcode
        ? `Hay más de un producto con el código ${barcode}`
        : `Hay más de un producto llamado "${row.name.trim()}"; agregá el código de barras para identificarlo`,
    );
  }
  return matches[0] ?? null;
}

/**
 * Upserts each row: an existing product (see findExistingForBulkRow) gets its price and
 * description updated and the "cantidad" added to its stock; otherwise a new Product is
 * created via createProduct. Stock always goes through createMovement so it uses the same
 * atomic increment + audit-trail path as any other stock-in — never a direct currentStock write.
 */
export async function bulkCreateProducts(
  localId: string | null | undefined,
  items: BulkProductRow[],
  userId: string,
): Promise<BulkProductResult[]> {
  const results: BulkProductResult[] = [];

  for (let i = 0; i < items.length; i++) {
    const row = items[i];
    try {
      if (!localId) throw ApiError.badRequest("Debe estar asociado a un local para cargar productos");

      const existing = await findExistingForBulkRow(localId, row);
      let product;
      if (existing) {
        const data: Prisma.ProductUpdateInput = {};
        if (row.precio !== undefined) data.sellPrice = row.precio;
        if (row.description) data.description = row.description;
        product = Object.keys(data).length
          ? await prisma.product.update({ where: { id: existing.id }, data, include: PRODUCT_INCLUDE })
          : await getProduct(localId, existing.id);
      } else {
        product = await createProduct(localId, {
          name: row.name.trim(),
          description: row.description || null,
          barcode: row.barcode?.trim() || null,
          unit: "unidad",
          costPrice: 0,
          sellPrice: row.precio ?? 0,
          minStock: 0,
        });
      }

      if (row.cantidad > 0) {
        await createMovement(
          localId,
          { productId: product.id, type: MovementType.IN, quantity: row.cantidad, reason: "Carga masiva" },
          userId,
        );
        product = await getProduct(localId, product.id);
      }

      results.push({ row: i, success: true, action: existing ? "updated" : "created", product });
    } catch (error) {
      results.push({ row: i, success: false, error: error instanceof ApiError ? error.message : "Error inesperado" });
    }
  }

  return results;
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

