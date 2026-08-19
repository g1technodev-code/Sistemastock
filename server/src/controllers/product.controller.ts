import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as productService from "../services/product.service";
import { listProductsQuerySchema, upsertProductSchema } from "../schemas/product.schema";
import { serializeDecimals } from "../utils/serialize";

export const list = catchAsync(async (req: Request, res: Response) => {
  const query = listProductsQuerySchema.parse(req.query);
  const result = await productService.listProducts(req.user?.localId, query);
  res.json(serializeDecimals(result));
});

export const getOne = catchAsync(async (req: Request, res: Response) => {
  const product = await productService.getProduct(req.user?.localId, req.params.id);
  res.json({ product: serializeDecimals(product) });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const input = upsertProductSchema.parse(req.body);
  const product = await productService.createProduct(req.user?.localId, input);
  res.status(201).json({ product: serializeDecimals(product) });
});


export const update = catchAsync(async (req: Request, res: Response) => {
  const input = upsertProductSchema.parse(req.body);
  const product = await productService.updateProduct(req.params.id, input);
  res.json({ product: serializeDecimals(product) });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  const result = await productService.deleteProduct(req.params.id);
  res.json(result);
});

export const lookupBarcode = catchAsync(async (req: Request, res: Response) => {
  const barcode = (req.query.code as string) || req.params.code;
  const result = await productService.lookupBarcode(barcode);
  res.json(result);
});

