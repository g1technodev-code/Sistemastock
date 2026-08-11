import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as mpService from "../services/mercadopago.service";

export const createCheckout = catchAsync(async (req: Request, res: Response) => {
  const { planId } = req.body as { planId: string };
  const userEmail = req.user!.email;

  const result = await mpService.createSubscriptionPreference(userEmail, planId);
  res.json(result);
});
