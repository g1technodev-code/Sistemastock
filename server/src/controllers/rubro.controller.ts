import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as rubroService from "../services/rubro.service";
import { upsertRubroSchema } from "../schemas/rubro.schema";

export const list = catchAsync(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive !== "false";
  const rubros = await rubroService.listRubros(includeInactive);
  res.json({ items: rubros });
});

export const listPublic = catchAsync(async (_req: Request, res: Response) => {
  const rubros = await rubroService.listRubros(false);
  res.json({ items: rubros });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const input = upsertRubroSchema.parse(req.body);
  const rubro = await rubroService.createRubro(input);
  res.status(201).json({ rubro });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const input = upsertRubroSchema.parse(req.body);
  const rubro = await rubroService.updateRubro(req.params.id, input);
  res.json({ rubro });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await rubroService.deleteRubro(req.params.id);
  res.status(204).send();
});
