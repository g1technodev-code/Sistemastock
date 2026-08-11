import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as planService from "../services/plan.service";
import { upsertPlanSchema } from "../schemas/plan.schema";
import { serializeDecimals } from "../utils/serialize";

export const list = catchAsync(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive !== "false";
  const plans = await planService.listPlans(includeInactive);
  res.json({ items: serializeDecimals(plans) });
});

export const listPublic = catchAsync(async (_req: Request, res: Response) => {
  const plans = await planService.listPublicPlans();
  res.json({ items: serializeDecimals(plans) });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const input = upsertPlanSchema.parse(req.body);
  const plan = await planService.createPlan(input);
  res.status(201).json({ plan: serializeDecimals(plan) });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const input = upsertPlanSchema.parse(req.body);
  const plan = await planService.updatePlan(req.params.id, input);
  res.json({ plan: serializeDecimals(plan) });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await planService.deletePlan(req.params.id);
  res.status(204).send();
});
