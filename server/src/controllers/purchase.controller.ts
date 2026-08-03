import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as purchaseService from "../services/purchase.service";
import { createPurchaseSchema, listPurchasesQuerySchema, updatePurchaseSchema } from "../schemas/purchase.schema";
import { serializeDecimals } from "../utils/serialize";

export const createPurchase = catchAsync(async (req: Request, res: Response) => {
  const input = createPurchaseSchema.parse(req.body);
  const purchase = await purchaseService.createPurchase(input, req.user!.id);
  res.status(201).json({ purchase: serializeDecimals(purchase) });
});

export const updatePurchase = catchAsync(async (req: Request, res: Response) => {
  const input = updatePurchaseSchema.parse(req.body);
  const purchase = await purchaseService.updatePurchase(req.params.id, input);
  res.json({ purchase: serializeDecimals(purchase) });
});

export const listPurchases = catchAsync(async (req: Request, res: Response) => {
  const query = listPurchasesQuerySchema.parse(req.query);
  const result = await purchaseService.listPurchases(query);
  res.json(serializeDecimals(result));
});

export const getPurchase = catchAsync(async (req: Request, res: Response) => {
  const purchase = await purchaseService.getPurchase(req.params.id);
  res.json({ purchase: serializeDecimals(purchase) });
});

export const receivePurchase = catchAsync(async (req: Request, res: Response) => {
  const purchase = await purchaseService.receivePurchase(req.params.id, req.user!.id);
  res.json({ purchase: serializeDecimals(purchase) });
});

export const cancelPurchase = catchAsync(async (req: Request, res: Response) => {
  const purchase = await purchaseService.cancelPurchase(req.params.id, req.user!.id);
  res.json({ purchase: serializeDecimals(purchase) });
});
