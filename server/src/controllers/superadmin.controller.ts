import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as superadminAction from "../features/admin/actions/superadmin.action";


export const getMetrics = catchAsync(async (_req: Request, res: Response) => {
  const data = await superadminAction.getSuperAdminMetrics();
  res.json(data);
});

export const listLocales = catchAsync(async (req: Request, res: Response) => {
  const result = await superadminAction.listLocales(req.query as any);
  res.json(result);
});

export const createLocal = catchAsync(async (req: Request, res: Response) => {
  const { name, ownerEmail, adminPassword, plan } = req.body;
  const result = await superadminAction.createLocal({ name, ownerEmail, adminPassword, plan });
  res.status(201).json(result);
});

export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.body as { status: "ACTIVE" | "SUSPENDED" | "DUE_SOON" };
  const updated = await superadminAction.updateLocalStatus(req.params.id, status);
  res.json(updated);
});

