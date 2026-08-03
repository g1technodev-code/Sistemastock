import { prisma } from "../config/prisma";
import { MovementType } from "@prisma/client";

export async function getStockValuationReport() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const rows = products.map((p) => ({
    sku: p.sku,
    name: p.name,
    category: p.category?.name ?? "Sin categoría",
    currentStock: p.currentStock,
    costPrice: Number(p.costPrice),
    sellPrice: Number(p.sellPrice),
    stockValue: Math.round(p.currentStock * Number(p.costPrice) * 100) / 100,
    potentialRevenue: Math.round(p.currentStock * Number(p.sellPrice) * 100) / 100,
  }));

  const totals = rows.reduce(
    (acc, r) => ({
      stockValue: acc.stockValue + r.stockValue,
      potentialRevenue: acc.potentialRevenue + r.potentialRevenue,
      units: acc.units + r.currentStock,
    }),
    { stockValue: 0, potentialRevenue: 0, units: 0 },
  );

  return { rows, totals };
}

export async function getMovementsReport(days = 30) {
  const from = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  from.setHours(0, 0, 0, 0);

  const movements = await prisma.stockMovement.findMany({
    where: { createdAt: { gte: from } },
    include: {
      product: { select: { name: true, sku: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const seriesMap = new Map<string, { date: string; in: number; out: number; adjustment: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    seriesMap.set(key, { date: key, in: 0, out: 0, adjustment: 0 });
  }
  for (const m of movements) {
    const key = m.createdAt.toISOString().slice(0, 10);
    const bucket = seriesMap.get(key);
    if (!bucket) continue;
    if (m.type === MovementType.IN) bucket.in += m.quantity;
    else if (m.type === MovementType.OUT) bucket.out += m.quantity;
    else bucket.adjustment += m.quantity;
  }

  return { series: Array.from(seriesMap.values()), movements };
}

export async function getTopProductsReport(days = 30, limit = 10) {
  const from = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);

  const grouped = await prisma.stockMovement.groupBy({
    by: ["productId", "type"],
    where: { createdAt: { gte: from } },
    _sum: { quantity: true },
  });

  const productIds = Array.from(new Set(grouped.map((g) => g.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true },
  });

  const byProduct = new Map<string, { productId: string; name: string; sku: string; in: number; out: number }>();
  for (const g of grouped) {
    const detail = products.find((p) => p.id === g.productId);
    const entry = byProduct.get(g.productId) ?? {
      productId: g.productId,
      name: detail?.name ?? "—",
      sku: detail?.sku ?? "—",
      in: 0,
      out: 0,
    };
    if (g.type === MovementType.IN) entry.in = g._sum.quantity ?? 0;
    if (g.type === MovementType.OUT) entry.out = g._sum.quantity ?? 0;
    byProduct.set(g.productId, entry);
  }

  return Array.from(byProduct.values())
    .sort((a, b) => b.out - a.out)
    .slice(0, limit);
}

export async function getCategoryBreakdownReport() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { currentStock: true, costPrice: true, categoryId: true, category: { select: { name: true, color: true } } },
  });

  const map = new Map<string, { name: string; color: string | null; productCount: number; stockValue: number; units: number }>();
  for (const p of products) {
    const key = p.categoryId ?? "sin-categoria";
    const entry = map.get(key) ?? {
      name: p.category?.name ?? "Sin categoría",
      color: p.category?.color ?? null,
      productCount: 0,
      stockValue: 0,
      units: 0,
    };
    entry.productCount += 1;
    entry.units += p.currentStock;
    entry.stockValue += p.currentStock * Number(p.costPrice);
    map.set(key, entry);
  }

  return Array.from(map.values())
    .map((c) => ({ ...c, stockValue: Math.round(c.stockValue * 100) / 100 }))
    .sort((a, b) => b.stockValue - a.stockValue);
}
