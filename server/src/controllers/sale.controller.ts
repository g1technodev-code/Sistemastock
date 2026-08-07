import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as saleService from "../services/sale.service";
import { createSaleSchema, listSalesQuerySchema, salesSummaryQuerySchema } from "../schemas/sale.schema";
import { serializeDecimals } from "../utils/serialize";
import { ApiError } from "../utils/apiError";

export const createSale = catchAsync(async (req: Request, res: Response) => {
  const input = createSaleSchema.parse(req.body);
  const sale = await saleService.createSale(req.user?.localId, input, req.user!.id);
  res.status(201).json({ sale: serializeDecimals(sale) });
});


export const listSales = catchAsync(async (req: Request, res: Response) => {
  const query = listSalesQuerySchema.parse(req.query);
  // EMPLOYEE role can only see their own sales history, not the whole company's.
  if (req.user!.role === "EMPLOYEE") {
    query.userId = req.user!.id;
  }
  const result = await saleService.listSales(query);
  res.json(serializeDecimals(result));
});

export const getSale = catchAsync(async (req: Request, res: Response) => {
  const sale = await saleService.getSale(req.params.id);
  if (req.user!.role === "EMPLOYEE" && sale.userId !== req.user!.id) {
    throw ApiError.notFound("Venta no encontrada");
  }
  res.json({ sale: serializeDecimals(sale) });
});

export const getSalesSummary = catchAsync(async (req: Request, res: Response) => {
  const query = salesSummaryQuerySchema.parse(req.query);
  if (req.user!.role === "EMPLOYEE") {
    query.userId = req.user!.id;
  }
  const summary = await saleService.getSalesSummary(query);
  res.json(serializeDecimals(summary));
});
