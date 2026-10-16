import { Prisma, SaleType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import type { PriceUpdateInput } from "../schemas/product.schema";

/**
 * Bulk price update by category and/or supplier. The preview (JS) and the apply
 * (single SQL UPDATE) use the same formula so what the user sees is what gets saved:
 *   new = ROUND(price * (1 + pct/100), 2), then rounded UP to a multiple of `rounding`
 *   (sell price only; cost is never rounded to round numbers).
 * Products sold "por importe" (AMOUNT) have no fixed price and are skipped.
 */

function buildWhere(localId: string, input: PriceUpdateInput): Prisma.ProductWhereInput {
  return {
    localId,
    saleType: { not: SaleType.AMOUNT },
    ...(input.categoryId ? { categoryId: input.categoryId } : {}),
    ...(input.supplierId ? { supplierId: input.supplierId } : {}),
  };
}

function applyPct(price: number, percentage: number) {
  return Math.round(price * (1 + percentage / 100) * 100) / 100;
}

function roundUp(price: number, rounding: number) {
  if (!rounding) return price;
  // The epsilon keeps exact multiples (e.g. 1100 / 10) from being bumped by float noise
  return Math.ceil(price / rounding - 1e-9) * rounding || 0; // avoid -0 for products priced at 0
}

export async function previewPriceUpdate(localId: string | null | undefined, input: PriceUpdateInput) {
  if (!localId) throw ApiError.badRequest("Debe estar asociado a un local");

  const products = await prisma.product.findMany({
    where: buildWhere(localId, input),
    select: { id: true, sku: true, name: true, costPrice: true, sellPrice: true },
    orderBy: { name: "asc" },
  });

  const items = products.map((p) => {
    const costPrice = Number(p.costPrice);
    const sellPrice = Number(p.sellPrice);
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      costPrice,
      sellPrice,
      newCostPrice: input.applyTo === "COST_AND_SELL" ? applyPct(costPrice, input.percentage) : costPrice,
      newSellPrice: roundUp(applyPct(sellPrice, input.percentage), input.rounding),
    };
  });

  return { count: items.length, items };
}

export async function applyPriceUpdate(localId: string | null | undefined, input: PriceUpdateInput) {
  if (!localId) throw ApiError.badRequest("Debe estar asociado a un local");

  const factor = Prisma.sql`((100 + ${input.percentage}::numeric) / 100)`;
  const rounding = Prisma.sql`${input.rounding}::numeric`;
  const newSell = input.rounding
    ? Prisma.sql`CEIL(ROUND("sellPrice" * ${factor}, 2) / ${rounding}) * ${rounding}`
    : Prisma.sql`ROUND("sellPrice" * ${factor}, 2)`;
  const newCost = input.applyTo === "COST_AND_SELL" ? Prisma.sql`ROUND("costPrice" * ${factor}, 2)` : Prisma.sql`"costPrice"`;

  const updated = await prisma.$executeRaw`
    UPDATE "products"
    SET "sellPrice" = ${newSell},
        "costPrice" = ${newCost},
        "updatedAt" = NOW()
    WHERE "localId" = ${localId}
      AND "saleType" <> 'AMOUNT'
      ${input.categoryId ? Prisma.sql`AND "categoryId" = ${input.categoryId}` : Prisma.empty}
      ${input.supplierId ? Prisma.sql`AND "supplierId" = ${input.supplierId}` : Prisma.empty}
  `;

  return { updated };
}
