import { prisma } from "../config/prisma";
import { MovementType, SaleStatus } from "@prisma/client";
import { getOrCreateRegister } from "./cash.service";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayKey(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

export async function getSummary() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      currentStock: true,
      minStock: true,
      costPrice: true,
      categoryId: true,
      category: { select: { name: true, color: true } },
    },
  });

  let totalStockValue = 0;
  let lowStockCount = 0;
  const categoryValueMap = new Map<string, { name: string; color: string | null; value: number }>();

  for (const p of products) {
    const value = p.currentStock * Number(p.costPrice);
    totalStockValue += value;
    if (p.currentStock <= p.minStock) lowStockCount++;

    const key = p.categoryId ?? "sin-categoria";
    const label = p.category?.name ?? "Sin categoría";
    const existing = categoryValueMap.get(key);
    if (existing) {
      existing.value += value;
    } else {
      categoryValueMap.set(key, { name: label, color: p.category?.color ?? null, value });
    }
  }

  const categoryBreakdown = Array.from(categoryValueMap.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map((c) => ({ ...c, value: Math.round(c.value * 100) / 100 }));

  const fourteenDaysAgo = startOfDay(new Date(Date.now() - 13 * 24 * 60 * 60 * 1000));
  const movements = await prisma.stockMovement.findMany({
    where: { createdAt: { gte: fourteenDaysAgo } },
    select: { type: true, quantity: true, createdAt: true },
  });

  const seriesMap = new Map<string, { date: string; in: number; out: number }>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(fourteenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    seriesMap.set(dayKey(d), { date: dayKey(d), in: 0, out: 0 });
  }
  for (const m of movements) {
    const key = dayKey(m.createdAt);
    const bucket = seriesMap.get(key);
    if (!bucket) continue;
    if (m.type === MovementType.IN) bucket.in += m.quantity;
    if (m.type === MovementType.OUT) bucket.out += m.quantity;
  }

  const todayKey = dayKey(new Date());
  const movementsToday = movements.filter((m) => dayKey(m.createdAt) === todayKey).length;

  const recentActivity = await prisma.stockMovement.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      product: { select: { id: true, name: true, sku: true } },
      user: { select: { id: true, name: true } },
    },
  });

  const topProductsRaw = await prisma.stockMovement.groupBy({
    by: ["productId"],
    where: { type: MovementType.OUT, createdAt: { gte: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000) } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });
  const topProductIds = topProductsRaw.map((t) => t.productId);
  const topProductDetails = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, sku: true },
  });
  const topProducts = topProductsRaw.map((t) => {
    const detail = topProductDetails.find((p) => p.id === t.productId);
    return { productId: t.productId, name: detail?.name ?? "—", sku: detail?.sku ?? "—", quantity: t._sum.quantity ?? 0 };
  });

  const todayStart = startOfDay(new Date());
  const [salesTodayAgg, register] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: todayStart }, status: SaleStatus.COMPLETED },
      _sum: { total: true },
    }),
    getOrCreateRegister(prisma),
  ]);

  return {
    kpis: {
      totalProducts: products.length,
      totalStockValue: Math.round(totalStockValue * 100) / 100,
      lowStockCount,
      movementsToday,
      salesToday: Number(salesTodayAgg._sum.total ?? 0),
      cashBalance: Number(register.currentBalance),
    },
    movementSeries: Array.from(seriesMap.values()),
    categoryBreakdown,
    topProducts,
    recentActivity,
  };
}
