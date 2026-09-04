import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as catalogProductService from "../services/catalogProduct.service";
import { upsertCatalogProductSchema, listCatalogProductsQuerySchema, bulkCatalogProductRowSchema } from "../schemas/catalogProduct.schema";
import { serializeDecimals } from "../utils/serialize";
import { buildTemplateBuffer, parseWorkbookRows, type ExcelColumn } from "../utils/excelBulk";

const BULK_COLUMNS: ExcelColumn[] = [
  { key: "name", header: "nombre" },
  { key: "description", header: "descripcion" },
  { key: "barcode", header: "codigo_barras" },
  { key: "rubro", header: "rubro" },
];

export const list = catchAsync(async (req: Request, res: Response) => {
  const query = listCatalogProductsQuerySchema.parse(req.query);
  const items = await catalogProductService.listCatalogProducts(query.rubroId, query.includeInactive);
  res.json({ items: serializeDecimals(items) });
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const input = upsertCatalogProductSchema.parse(req.body);
  const catalogProduct = await catalogProductService.createCatalogProduct(input);
  res.status(201).json({ catalogProduct: serializeDecimals(catalogProduct) });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const input = upsertCatalogProductSchema.parse(req.body);
  const catalogProduct = await catalogProductService.updateCatalogProduct(req.params.id, input);
  res.json({ catalogProduct: serializeDecimals(catalogProduct) });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  await catalogProductService.deleteCatalogProduct(req.params.id);
  res.status(204).send();
});

export const downloadTemplate = catchAsync(async (_req: Request, res: Response) => {
  const buffer = await buildTemplateBuffer(BULK_COLUMNS, {
    name: "Coca-Cola 500ml",
    description: "Gaseosa línea Coca-Cola",
    barcode: "7790895000782",
    rubro: "Kiosco",
  });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=plantilla-catalogo.xlsx");
  res.send(Buffer.from(buffer));
});

type RowResult = { row: number; success: boolean; error?: string; catalogProduct?: unknown };

export const bulkCreate = catchAsync(async (req: Request, res: Response) => {
  const rawRows = await parseWorkbookRows(req.file!.buffer, BULK_COLUMNS);

  const results: RowResult[] = [];
  const validRows: { row: number; data: ReturnType<typeof bulkCatalogProductRowSchema.parse> }[] = [];
  rawRows.forEach((raw, i) => {
    const parsed = bulkCatalogProductRowSchema.safeParse(raw);
    if (!parsed.success) {
      results.push({ row: i, success: false, error: parsed.error.errors[0]?.message ?? "Fila inválida" });
    } else {
      validRows.push({ row: i, data: parsed.data });
    }
  });

  const created = await catalogProductService.bulkCreateCatalogProducts(validRows.map((r) => r.data));
  created.forEach((result, idx) => results.push({ ...result, row: validRows[idx].row }));

  results.sort((a, b) => a.row - b.row);
  res.status(201).json({ results });
});
