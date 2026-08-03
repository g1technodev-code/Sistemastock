import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as categoryService from "../services/category.service";
import { upsertCategorySchema } from "../schemas/category.schema";
import { serializeDecimals } from "../utils/serialize";

export const list = catchAsync(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive !== "false";
  const categories = await categoryService.listCategories(includeInactive);
  res.json({ items: serializeDecimals(categories) });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const input = upsertCategorySchema.parse(req.body);
  const category = await categoryService.createCategory(input);
  res.status(201).json({ category });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const input = upsertCategorySchema.parse(req.body);
  const category = await categoryService.updateCategory(req.params.id, input);
  res.json({ category });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await categoryService.deleteCategory(req.params.id);
  res.status(204).send();
});
