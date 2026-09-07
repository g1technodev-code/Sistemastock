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

import { supplierPaymentSchema, listSupplierMovementsQuerySchema } from "../schemas/supplier.schema";

export const getAccount = catchAsync(async (req: Request, res: Response) => {
  const supplier = await supplierService.getSupplierAccount(req.user?.localId, req.params.id);
  res.json({ supplier });
});

export const listMovements = catchAsync(async (req: Request, res: Response) => {
  const query = listSupplierMovementsQuerySchema.parse(req.query);
  const result = await supplierService.listSupplierMovements(req.user?.localId, req.params.id, query);
  res.json(result);
});

export const registerPayment = catchAsync(async (req: Request, res: Response) => {
  const input = supplierPaymentSchema.parse(req.body);
  const movement = await supplierService.registerPayment(req.user?.localId, req.params.id, input, req.user!.id);
  res.status(201).json({ movement });
});

