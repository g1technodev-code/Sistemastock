import { prisma } from "../config/prisma";
import { SaleStatus } from "@prisma/client";
import { getOrCreateRegister } from "./cash.service";

const NO_MOVEMENT_DAYS = 30;
const ALERT_LIST_LIMIT = 6;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getSummary(localId: string | null | undefined) {
  if (!localId) {
    return {
      kpis: {
        totalProducts: 0,
        totalStockValue: 0,
        lowStockCount: 0,
        movementsToday: 0,
        salesToday: 0,
        cashBalance: 0,
        profitToday: 0,
        unitsSoldToday: 0,
        avgTicketToday: 0,
        noMovementCount: 0,
      },
      alerts: { lowStock: [], noMovement: [], noSupplier: [] },
      recentActivity: [],
    };
  }

  const products = await prisma.product.findMany({
    where: { localId, isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      currentStock: true,
      minStock: true,
      costPrice: true,
      supplierId: true,
    },
  });

  let totalStockValue = 0;
  let lowStockCount = 0;
  const lowStockAlerts: { productId: string; name: string; sku: string; currentStock: number; minStock: number }[] = [];
  const noSupplierAlerts: { productId: string; name: string; sku: string }[] = [];

  for (const p of products) {
    totalStockValue += p.currentStock * Number(p.costPrice);
    if (p.currentStock <= p.minStock) {
      lowStockCount++;
      lowStockAlerts.push({ productId: p.id, name: p.name, sku: p.sku, currentStock: p.currentStock, minStock: p.minStock });
    }
    if (!p.supplierId) {
      noSupplierAlerts.push({ productId: p.id, name: p.name, sku: p.sku });
    }
  }
  lowStockAlerts.sort((a, b) => a.currentStock - b.currentStock);

  const lastMovements = await prisma.stockMovement.groupBy({
    by: ["productId"],
    where: { localId },
    _max: { createdAt: true },
  });
  const lastMovementMap = new Map<string, Date>(
    lastMovements.map((m) => [m.productId, m._max.createdAt!]),
  );
  const noMovementThreshold = new Date(Date.now() - NO_MOVEMENT_DAYS * 24 * 60 * 60 * 1000);

  let noMovementCount = 0;
  const noMovementAlerts: { productId: string; name: string; sku: string; daysSinceLastMovement: number | null }[] = [];
  for (const p of products) {
    const last = lastMovementMap.get(p.id) ?? null;
    if (last && last >= noMovementThreshold) continue;
    noMovementCount++;
    const daysSinceLastMovement = last ? Math.floor((Date.now() - last.getTime()) / (24 * 60 * 60 * 1000)) : null;
    noMovementAlerts.push({ productId: p.id, name: p.name, sku: p.sku, daysSinceLastMovement });
  }
  noMovementAlerts.sort((a, b) => (b.daysSinceLastMovement ?? Infinity) - (a.daysSinceLastMovement ?? Infinity));

  const todayStart = startOfDay(new Date());
  const [movementsToday, todaySales, register] = await Promise.all([
    prisma.stockMovement.count({ where: { localId, createdAt: { gte: todayStart } } }),
    prisma.sale.findMany({
      where: { localId, createdAt: { gte: todayStart }, status: SaleStatus.COMPLETED },
      select: {
        total: true,
        items: { select: { quantity: true, subtotal: true, product: { select: { costPrice: true } } } },
      },
    }),
    getOrCreateRegister(prisma, localId),
  ]);

  let profitToday = 0;
  let unitsSoldToday = 0;
  for (const sale of todaySales) {
    for (const item of sale.items) {
      unitsSoldToday += item.quantity;
      profitToday += Number(item.subtotal) - item.quantity * Number(item.product.costPrice);
    }
  }
  const salesTotalToday = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
  const avgTicketToday = todaySales.length > 0 ? salesTotalToday / todaySales.length : 0;

  const recentActivity = await prisma.stockMovement.findMany({
    where: { localId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      product: { select: { id: true, name: true, sku: true } },
      user: { select: { id: true, name: true } },
    },
  });

  return {
    kpis: {
      totalProducts: products.length,
      totalStockValue: Math.round(totalStockValue * 100) / 100,
      lowStockCount,
      movementsToday,
      salesToday: Math.round(salesTotalToday * 100) / 100,
      cashBalance: Number(register.currentBalance),
      profitToday: Math.round(profitToday * 100) / 100,
      unitsSoldToday,
      avgTicketToday: Math.round(avgTicketToday * 100) / 100,
      noMovementCount,
    },
    alerts: {
      lowStock: lowStockAlerts.slice(0, ALERT_LIST_LIMIT),
      noMovement: noMovementAlerts.slice(0, ALERT_LIST_LIMIT),
      noSupplier: noSupplierAlerts.slice(0, ALERT_LIST_LIMIT),
    },
    recentActivity,
  };
}
