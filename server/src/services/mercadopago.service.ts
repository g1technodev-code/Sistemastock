import { MercadoPagoConfig, Preference } from "mercadopago";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";

const mpAccessToken = process.env.MP_ACCESS_TOKEN || "TEST-ACCESS-TOKEN";
const client = new MercadoPagoConfig({ accessToken: mpAccessToken });

export type PlanType = "BASICO" | "PRO";

export const PLAN_DETAILS: Record<PlanType, { id: PlanType; name: string; price: number; description: string }> = {
  BASICO: {
    id: "BASICO",
    name: "Kipo Básico",
    price: 24900,
    description: "Plan mensual Kipo Básico - Gestión de stock, compras y ventas",
  },
  PRO: {
    id: "PRO",
    name: "Kipo Pro",
    price: 39900,
    description: "Plan mensual Kipo Pro - Solución completa con Caja, Auditorías y Rentabilidad",
  },
};

export async function createSubscriptionPreference(userEmail: string, planType: PlanType) {
  const plan = PLAN_DETAILS[planType];
  if (!plan) {
    throw ApiError.badRequest("Plan no válido");
  }

  const preference = new Preference(client);

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  const response = await preference.create({
    body: {
      items: [
        {
          id: plan.id,
          title: plan.name,
          description: plan.description,
          quantity: 1,
          unit_price: plan.price,
          currency_id: "ARS",
        },
      ],
      payer: {
        email: userEmail,
      },
      back_urls: {
        success: `${clientUrl}/plans?status=success&plan=${plan.id}`,
        failure: `${clientUrl}/plans?status=failure`,
        pending: `${clientUrl}/plans?status=pending`,
      },
      auto_return: "approved",
      external_reference: JSON.stringify({ userEmail, planId: plan.id }),
    },
  });

  return {
    initPoint: response.init_point,
    sandboxInitPoint: response.sandbox_init_point,
    preferenceId: response.id,
  };
}
