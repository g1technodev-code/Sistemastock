import { api } from "./client";
import type { Plan } from "../lib/types";

export type PlanInput = {
  name: string;
  description?: string | null;
  monthlyPrice: number;
  maxAdmins: number;
  maxEmployees: number;
  isTrial?: boolean;
  trialDays?: number | null;
  isRecommended?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  features?: string[];
};

export async function listPlans(includeInactive = true): Promise<Plan[]> {
  const { data } = await api.get("/superadmin/plans", { params: { includeInactive } });
  return data.items;
}

export async function createPlan(input: PlanInput): Promise<Plan> {
  const { data } = await api.post("/superadmin/plans", input);
  return data.plan;
}

export async function updatePlan(id: string, input: PlanInput): Promise<Plan> {
  const { data } = await api.patch(`/superadmin/plans/${id}`, input);
  return data.plan;
}

export async function deletePlan(id: string): Promise<void> {
  await api.delete(`/superadmin/plans/${id}`);
}
