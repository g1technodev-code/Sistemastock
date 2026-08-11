export const PLAN_FEATURES = ["CASH_REGISTER", "PURCHASES", "PHYSICAL_INVENTORY", "REPORTS", "CUSTOMERS"] as const;

export type PlanFeature = (typeof PLAN_FEATURES)[number];

export const PLAN_FEATURE_LABELS: Record<PlanFeature, string> = {
  CASH_REGISTER: "Caja",
  PURCHASES: "Compras",
  PHYSICAL_INVENTORY: "Inventario Físico",
  REPORTS: "Reportes, Estadísticas y Rentabilidad",
  CUSTOMERS: "Clientes",
};
