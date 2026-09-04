import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as catalogProductService from "../services/catalogProduct.service";
import { importCatalogProductSchema } from "../schemas/catalogProduct.schema";
import { serializeDecimals } from "../utils/serialize";

export const browse = catchAsync(async (req: Request, res: Response) => {
  const items = await catalogProductService.browseCatalogForLocal(req.user?.localId);
  res.json({ items: serializeDecimals(items) });
});

export const importOne = catchAsync(async (req: Request, res: Response) => {
  const input = importCatalogProductSchema.parse(req.body);
  const product = await catalogProductService.importCatalogProduct(req.user?.localId, req.params.id, input);
  res.status(201).json({ product: serializeDecimals(product) });
});
