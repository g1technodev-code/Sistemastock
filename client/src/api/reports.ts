import { api } from "./client";

export type StockValuationRow = {
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  costPrice: number;
  sellPrice: number;
  stockValue: number;
  potentialRevenue: number;
};

export type StockValuationReport = {
  rows: StockValuationRow[];
  totals: { stockValue: number; potentialRevenue: number; units: number };
};

export type MovementsReport = {
  series: { date: string; in: number; out: number; adjustment: number }[];
  movements: Array<{
    id: string;
    type: string;
    quantity: number;
    createdAt: string;
    reason: string | null;
    product: { name: string; sku: string };
    user: { name: string };
  }>;
};

export type TopProductReportItem = { productId: string; name: string; sku: string; in: number; out: number };
export type CategoryBreakdownItem = { name: string; color: string | null; productCount: number; stockValue: number; units: number };

export type SalesStatsPeriod = { total: number; count: number; avgTicket: number; profit: number };
export type SalesStatsReport = {
  periods: { today: SalesStatsPeriod; week: SalesStatsPeriod; month: SalesStatsPeriod; year: SalesStatsPeriod };
  topProducts: { productId: string; name: string; sku: string; quantity: number; revenue: number }[];
  topCategories: { name: string; color: string | null; quantity: number; revenue: number }[];
  byEmployee: { userId: string; name: string; total: number; count: number }[];
  byPaymentMethod: { paymentMethod: string; total: number; count: number }[];
};

export type ProfitabilityProduct = {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
};
export type ProfitabilityReport = {
  totals: { revenue: number; cost: number; grossProfit: number; marginPercent: number };
  products: ProfitabilityProduct[];
};

export async function getStockValuationReport(): Promise<StockValuationReport> {
  const { data } = await api.get("/reports/stock-valuation");
  return data;
}

export async function getMovementsReport(days = 30): Promise<MovementsReport> {
  const { data } = await api.get("/reports/movements", { params: { days } });
  return data;
}

export async function getTopProductsReport(days = 30): Promise<TopProductReportItem[]> {
  const { data } = await api.get("/reports/top-products", { params: { days } });
  return data.items;
}

export async function getCategoryBreakdownReport(): Promise<CategoryBreakdownItem[]> {
  const { data } = await api.get("/reports/category-breakdown");
  return data.items;
}

export async function getSalesStatsReport(): Promise<SalesStatsReport> {
  const { data } = await api.get("/reports/sales-stats");
  return data;
}

export async function getProfitabilityReport(days = 30): Promise<ProfitabilityReport> {
  const { data } = await api.get("/reports/profitability", { params: { days } });
  return data;
}

export async function downloadCsv(report: "stock-valuation" | "movements", filename: string, params: Record<string, string> = {}) {
  const response = await api.get(`/reports/${report}`, { params: { ...params, format: "csv" }, responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
