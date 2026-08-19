import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as inventoryCountService from "../services/inventoryCount.service";
import { createInventoryCountSchema, listInventoryCountsQuerySchema, upsertItemSchema } from "../schemas/inventoryCount.schema";
import { serializeDecimals } from "../utils/serialize";

export const createSession = catchAsync(async (req: Request, res: Response) => {
  const input = createInventoryCountSchema.parse(req.body);
  const session = await inventoryCountService.createSession(req.user?.localId, input, req.user!.id);
  res.status(201).json({ session: serializeDecimals(session) });
});


export const listSessions = catchAsync(async (req: Request, res: Response) => {
  const query = listInventoryCountsQuerySchema.parse(req.query);
  const result = await inventoryCountService.listSessions(req.user?.localId, query);
  res.json(serializeDecimals(result));
});

export const getSession = catchAsync(async (req: Request, res: Response) => {
  const session = await inventoryCountService.getSession(req.user?.localId, req.params.id);
  res.json({ session: serializeDecimals(session) });
});

export const upsertItem = catchAsync(async (req: Request, res: Response) => {
  const input = upsertItemSchema.parse(req.body);
  const session = await inventoryCountService.upsertItem(req.user?.localId, req.params.id, input);
  res.json({ session: serializeDecimals(session) });
});

export const removeItem = catchAsync(async (req: Request, res: Response) => {
  const session = await inventoryCountService.removeItem(req.user?.localId, req.params.id, req.params.productId);
  res.json({ session: serializeDecimals(session) });
});

export const confirmSession = catchAsync(async (req: Request, res: Response) => {
  const session = await inventoryCountService.confirmSession(req.user?.localId, req.params.id, req.user!.id);
  res.json({ session: serializeDecimals(session) });
});
