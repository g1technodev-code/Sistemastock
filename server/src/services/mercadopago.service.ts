import { MercadoPagoConfig, Preference } from "mercadopago";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";

const mpAccessToken = process.env.MP_ACCESS_TOKEN || "TEST-ACCESS-TOKEN";
const client = new MercadoPagoConfig({ accessToken: mpAccessToken });

export async function createSubscriptionPreference(userEmail: string, planId: string) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive || plan.isTrial) {
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
          description: plan.description ?? plan.name,
          quantity: 1,
          unit_price: Number(plan.monthlyPrice),
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
