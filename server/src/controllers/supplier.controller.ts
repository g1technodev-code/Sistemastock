import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as supplierService from "../services/supplier.service";
import { upsertSupplierSchema } from "../schemas/supplier.schema";

export const list = catchAsync(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive !== "false";
  const suppliers = await supplierService.listSuppliers(req.user?.localId, includeInactive);
  res.json({ items: suppliers });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const input = upsertSupplierSchema.parse(req.body);
  const supplier = await supplierService.createSupplier(req.user?.localId, input);
  res.status(201).json({ supplier });
});


export const update = catchAsync(async (req: Request, res: Response) => {
  const input = upsertSupplierSchema.parse(req.body);
  const supplier = await supplierService.updateSupplier(req.user?.localId, req.params.id, input);
  res.json({ supplier });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await supplierService.deleteSupplier(req.user?.localId, req.params.id);
  res.status(204).send();
});
