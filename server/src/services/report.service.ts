import { prisma } from "../config/prisma";
import { MovementType, SaleStatus } from "@prisma/client";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

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

type SaleStatsPeriod = { total: number; count: number; avgTicket: number; profit: number };

export async function getSalesStatsReport() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
  const yearStart = new Date(todayStart.getFullYear(), 0, 1);
  const rangeStart = yearStart < weekStart ? yearStart : weekStart;

  const sales = await prisma.sale.findMany({
    where: { status: SaleStatus.COMPLETED, createdAt: { gte: rangeStart } },
    select: {
      id: true,
      total: true,
      createdAt: true,
      userId: true,
      paymentMethod: true,
      user: { select: { name: true } },
      items: {
        select: {
          quantity: true,
          subtotal: true,
          product: {
            select: { id: true, name: true, sku: true, costPrice: true, categoryId: true, category: { select: { name: true, color: true } } },
          },
        },
      },
    },
  });

  function statsFor(from: Date): SaleStatsPeriod {
    const subset = sales.filter((s) => s.createdAt >= from);
    let profit = 0;
    for (const s of subset) {
      for (const it of s.items) profit += Number(it.subtotal) - it.quantity * Number(it.product.costPrice);
    }
    const total = subset.reduce((sum, s) => sum + Number(s.total), 0);
    const count = subset.length;
    return { total: round2(total), count, avgTicket: count > 0 ? round2(total / count) : 0, profit: round2(profit) };
  }

  const periods = {
    today: statsFor(todayStart),
    week: statsFor(weekStart),
    month: statsFor(monthStart),
    year: statsFor(yearStart),
  };

  const last30Start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  const recent = sales.filter((s) => s.createdAt >= last30Start);

  const productMap = new Map<string, { productId: string; name: string; sku: string; quantity: number; revenue: number }>();
  const categoryMap = new Map<string, { name: string; color: string | null; quantity: number; revenue: number }>();
  const employeeMap = new Map<string, { userId: string; name: string; total: number; count: number }>();
  const paymentMap = new Map<string, { paymentMethod: string; total: number; count: number }>();

  for (const s of recent) {
    for (const it of s.items) {
      const p = it.product;
      const revenue = Number(it.subtotal);

      const pe = productMap.get(p.id) ?? { productId: p.id, name: p.name, sku: p.sku, quantity: 0, revenue: 0 };
      pe.quantity += it.quantity;
      pe.revenue += revenue;
      productMap.set(p.id, pe);

      const catKey = p.categoryId ?? "sin-categoria";
      const ce = categoryMap.get(catKey) ?? { name: p.category?.name ?? "Sin categoría", color: p.category?.color ?? null, quantity: 0, revenue: 0 };
      ce.quantity += it.quantity;
      ce.revenue += revenue;
      categoryMap.set(catKey, ce);
    }

    const emp = employeeMap.get(s.userId) ?? { userId: s.userId, name: s.user.name, total: 0, count: 0 };
    emp.total += Number(s.total);
    emp.count += 1;
    employeeMap.set(s.userId, emp);

    const pm = paymentMap.get(s.paymentMethod) ?? { paymentMethod: s.paymentMethod, total: 0, count: 0 };
    pm.total += Number(s.total);
    pm.count += 1;
    paymentMap.set(s.paymentMethod, pm);
  }

  return {
    periods,
    topProducts: Array.from(productMap.values())
      .map((p) => ({ ...p, revenue: round2(p.revenue) }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10),
    topCategories: Array.from(categoryMap.values())
      .map((c) => ({ ...c, revenue: round2(c.revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8),
    byEmployee: Array.from(employeeMap.values())
      .map((e) => ({ ...e, total: round2(e.total) }))
      .sort((a, b) => b.total - a.total),
    byPaymentMethod: Array.from(paymentMap.values())
      .map((p) => ({ ...p, total: round2(p.total) }))
      .sort((a, b) => b.total - a.total),
  };
}

export async function getProfitabilityReport(days = 30) {
  const from = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  from.setHours(0, 0, 0, 0);

  const items = await prisma.saleItem.findMany({
    where: { sale: { status: SaleStatus.COMPLETED, createdAt: { gte: from } } },
    select: {
      quantity: true,
      subtotal: true,
      product: { select: { id: true, name: true, sku: true, costPrice: true } },
    },
  });

  const map = new Map<string, { productId: string; name: string; sku: string; quantity: number; revenue: number; cost: number }>();
  for (const it of items) {
    const p = it.product;
    const entry = map.get(p.id) ?? { productId: p.id, name: p.name, sku: p.sku, quantity: 0, revenue: 0, cost: 0 };
    entry.quantity += it.quantity;
    entry.revenue += Number(it.subtotal);
    entry.cost += it.quantity * Number(p.costPrice);
    map.set(p.id, entry);
  }

  const products = Array.from(map.values())
    .map((e) => {
      const profit = e.revenue - e.cost;
      return {
        ...e,
        revenue: round2(e.revenue),
        cost: round2(e.cost),
        profit: round2(profit),
        marginPercent: e.revenue > 0 ? round2((profit / e.revenue) * 100) : 0,
      };
    })
    .sort((a, b) => b.profit - a.profit);

  const totals = products.reduce(
    (acc, p) => ({ revenue: acc.revenue + p.revenue, cost: acc.cost + p.cost, profit: acc.profit + p.profit }),
    { revenue: 0, cost: 0, profit: 0 },
  );

  return {
    totals: {
      revenue: round2(totals.revenue),
      cost: round2(totals.cost),
      grossProfit: round2(totals.profit),
      marginPercent: totals.revenue > 0 ? round2((totals.profit / totals.revenue) * 100) : 0,
    },
    products,
  };
}
