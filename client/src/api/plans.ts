import { api } from "./client";
import type { Plan } from "../lib/types";

export type PlanId = string;

export type CheckoutResponse = {
  initPoint: string;
  sandboxInitPoint?: string;
  preferenceId: string;
};

export async function listPublicPlans(): Promise<Plan[]> {
  const { data } = await api.get("/plans");
  return data.items;
}

export async function createCheckout(planId: PlanId): Promise<CheckoutResponse> {
  const { data } = await api.post("/mercadopago/checkout", { planId });
  return data;
}
