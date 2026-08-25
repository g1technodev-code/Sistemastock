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
  const { name, ownerEmail, adminPassword, planId, rubroId } = req.body;
  const result = await superadminAction.createLocal({ name, ownerEmail, adminPassword, planId, rubroId });
  res.status(201).json(result);
});

export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.body as { status: "ACTIVE" | "SUSPENDED" | "DUE_SOON" };
  const updated = await superadminAction.updateLocalStatus(req.params.id, status);
  res.json(updated);
});

export const updatePlan = catchAsync(async (req: Request, res: Response) => {
  const { planId } = req.body as { planId: string };
  const updated = await superadminAction.updateLocalPlan(req.params.id, planId);
  res.json(updated);
});

export const updateRubro = catchAsync(async (req: Request, res: Response) => {
  const { rubroId } = req.body as { rubroId: string | null };
  const updated = await superadminAction.updateLocalRubro(req.params.id, rubroId);
  res.json(updated);
});

export const removeLocal = catchAsync(async (req: Request, res: Response) => {
  const result = await superadminAction.deleteLocal(req.params.id);
  res.json({ message: "Local eliminado correctamente", local: result });
});

export const createAnnouncement = catchAsync(async (req: Request, res: Response) => {
  const result = await superadminAction.createAnnouncement(req.body);
  res.status(201).json(result);
});

export const listAnnouncements = catchAsync(async (_req: Request, res: Response) => {
  const items = await superadminAction.listAnnouncements();
  res.json({ items });
});

export const removeAnnouncement = catchAsync(async (req: Request, res: Response) => {
  const result = await superadminAction.deleteAnnouncement(req.params.id);
  res.json({ message: "Anuncio eliminado correctamente", announcement: result });
});

export const getLatestAnnouncement = catchAsync(async (_req: Request, res: Response) => {
  const announcement = await superadminAction.getLatestAnnouncement();
  res.json({ announcement });
});

export const listPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await superadminAction.listSubscriptionPayments(req.query as any);
  res.json(result);
});

export const createManualPayment = catchAsync(async (req: Request, res: Response) => {
  const payment = await superadminAction.createManualPayment(req.body);
  res.status(201).json({ payment });
});



