export const PLAN_FEATURES = ["CASH_REGISTER", "PURCHASES", "REPORTS", "CUSTOMERS"] as const;

export type PlanFeature = (typeof PLAN_FEATURES)[number];

export const PLAN_FEATURE_LABELS: Record<PlanFeature, string> = {
  CASH_REGISTER: "Caja",
  PURCHASES: "Compras",
  REPORTS: "Reportes, Estadísticas y Rentabilidad",
  CUSTOMERS: "Clientes",
};
