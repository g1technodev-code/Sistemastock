import type { AuthUser } from "./types";

/** Mirrors server/src/constants/planFeatures.ts — keep both in sync. */
export const PLAN_FEATURES = ["CASH_REGISTER", "PURCHASES", "REPORTS", "CUSTOMERS"] as const;

export type PlanFeature = (typeof PLAN_FEATURES)[number];

export const PLAN_FEATURE_LABELS: Record<PlanFeature, string> = {
  CASH_REGISTER: "Caja",
  PURCHASES: "Compras",
  REPORTS: "Reportes, Estadísticas y Rentabilidad",
  CUSTOMERS: "Clientes",
};

export function hasFeature(user: AuthUser | null, feature: PlanFeature): boolean {
  if (!user) return false;
  if (user.role === "SUPERADMIN") return true;
  return user.planFeatures?.includes(feature) ?? false;
}
