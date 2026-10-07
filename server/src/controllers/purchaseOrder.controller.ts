import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as poService from "../services/purchaseOrder.service";
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  listPurchaseOrdersQuerySchema,
  receivePurchaseOrderSchema,
} from "../schemas/purchaseOrder.schema";

export const list = catchAsync(async (req: Request, res: Response) => {
  const query = listPurchaseOrdersQuerySchema.parse(req.query);
  const result = await poService.listPurchaseOrders(req.user?.localId, query);
  res.json(result);
});

export const get = catchAsync(async (req: Request, res: Response) => {
  const po = await poService.getPurchaseOrder(req.user?.localId, req.params.id);
  res.json({ purchaseOrder: po });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const input = createPurchaseOrderSchema.parse(req.body);
  const po = await poService.createPurchaseOrder(req.user?.localId, input, req.user!.id);
  res.status(201).json({ purchaseOrder: po });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const input = updatePurchaseOrderSchema.parse(req.body);
  const po = await poService.updatePurchaseOrder(req.user?.localId, req.params.id, input);
  res.json({ purchaseOrder: po });
});

export const receive = catchAsync(async (req: Request, res: Response) => {
  const input = receivePurchaseOrderSchema.parse(req.body);
  const purchase = await poService.receivePurchaseOrder(req.user?.localId, req.params.id, input, req.user!.id);
  res.status(201).json({ purchase });
});
