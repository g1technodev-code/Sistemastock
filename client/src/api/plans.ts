import { api } from "./client";

export type PlanId = "BASICO" | "PRO";

export type CheckoutResponse = {
  initPoint: string;
  sandboxInitPoint?: string;
  preferenceId: string;
};

export async function createCheckout(planId: PlanId): Promise<CheckoutResponse> {
  const { data } = await api.post("/mercadopago/checkout", { planId });
  return data;
}
