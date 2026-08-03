import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as reportService from "../services/report.service";
import { serializeDecimals } from "../utils/serialize";
import { toCsv } from "../utils/csv";

export const stockValuation = catchAsync(async (req: Request, res: Response) => {
  const data = await reportService.getStockValuationReport();
  if (req.query.format === "csv") {
    const csv = toCsv(data.rows, [
      { key: "sku", header: "SKU" },
      { key: "name", header: "Producto" },
      { key: "category", header: "Categoría" },
      { key: "currentStock", header: "Stock actual" },
      { key: "costPrice", header: "Costo unitario" },
      { key: "sellPrice", header: "Precio de venta" },
      { key: "stockValue", header: "Valor en inventario" },
      { key: "potentialRevenue", header: "Ingreso potencial" },
    ]);
    res.header("Content-Type", "text/csv");
    res.attachment("valoracion-stock.csv");
    return res.send(csv);
  }
  res.json(serializeDecimals(data));
});

export const movements = catchAsync(async (req: Request, res: Response) => {
  const days = Number(req.query.days) || 30;
  const data = await reportService.getMovementsReport(days);
  if (req.query.format === "csv") {
    const rows = data.movements.map((m) => ({
      fecha: m.createdAt.toISOString(),
      producto: m.product.name,
      sku: m.product.sku,
      tipo: m.type,
      cantidad: m.quantity,
      usuario: m.user.name,
      motivo: m.reason ?? "",
    }));
    const csv = toCsv(rows, [
      { key: "fecha", header: "Fecha" },
      { key: "producto", header: "Producto" },
      { key: "sku", header: "SKU" },
      { key: "tipo", header: "Tipo" },
      { key: "cantidad", header: "Cantidad" },
      { key: "usuario", header: "Usuario" },
      { key: "motivo", header: "Motivo" },
    ]);
    res.header("Content-Type", "text/csv");
    res.attachment("movimientos-stock.csv");
    return res.send(csv);
  }
  res.json(serializeDecimals(data));
});

export const topProducts = catchAsync(async (req: Request, res: Response) => {
  const days = Number(req.query.days) || 30;
  const limit = Number(req.query.limit) || 10;
  const data = await reportService.getTopProductsReport(days, limit);
  res.json({ items: data });
});

export const categoryBreakdown = catchAsync(async (_req: Request, res: Response) => {
  const data = await reportService.getCategoryBreakdownReport();
  res.json({ items: serializeDecimals(data) });
});
