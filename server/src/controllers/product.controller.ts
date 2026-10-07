import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as productService from "../services/product.service";
import { listProductsQuerySchema, upsertProductSchema, bulkProductRowSchema } from "../schemas/product.schema";
import { serializeDecimals } from "../utils/serialize";
import { buildTemplateBuffer, parseWorkbookRows, type ExcelColumn } from "../utils/excelBulk";

const BULK_COLUMNS: ExcelColumn[] = [
  { key: "name", header: "nombre" },
  { key: "description", header: "descripcion" },
  { key: "barcode", header: "codigo_barras" },
  { key: "cantidad", header: "cantidad" },
  { key: "precio", header: "precio" },
];

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
  const product = await productService.createProduct(req.user?.localId, input, req.user?.id);
  res.status(201).json({ product: serializeDecimals(product) });
});



export const update = catchAsync(async (req: Request, res: Response) => {
  const input = upsertProductSchema.parse(req.body);
  const product = await productService.updateProduct(req.user?.localId, req.params.id, input);
  res.json({ product: serializeDecimals(product) });
});

export const remove = catchAsync(async (req: Request, res: Response) => {
  const result = await productService.deleteProduct(req.user?.localId, req.params.id);
  res.json(result);
});

export const downloadBulkTemplate = catchAsync(async (_req: Request, res: Response) => {
  const buffer = await buildTemplateBuffer(BULK_COLUMNS, {
    name: "Producto de ejemplo",
    description: "Descripción opcional",
    barcode: "7790895000782",
    cantidad: 10,
    precio: 1500,
  });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=plantilla-productos.xlsx");
  res.send(Buffer.from(buffer));
});

type RowResult = { row: number; success: boolean; error?: string; product?: unknown };

export const bulkCreate = catchAsync(async (req: Request, res: Response) => {
  const rawRows = await parseWorkbookRows(req.file!.buffer, BULK_COLUMNS);

  const results: RowResult[] = [];
  const validRows: { row: number; data: ReturnType<typeof bulkProductRowSchema.parse> }[] = [];
  rawRows.forEach((raw, i) => {
    const parsed = bulkProductRowSchema.safeParse(raw);
    if (!parsed.success) {
      results.push({ row: i, success: false, error: parsed.error.errors[0]?.message ?? "Fila inválida" });
    } else {
      validRows.push({ row: i, data: parsed.data });
    }
  });

  const created = await productService.bulkCreateProducts(req.user?.localId, validRows.map((r) => r.data), req.user!.id);
  created.forEach((result, idx) => results.push({ ...serializeDecimals(result), row: validRows[idx].row }));

  results.sort((a, b) => a.row - b.row);
  res.status(201).json({ results });
});

export const lookupBarcode = catchAsync(async (req: Request, res: Response) => {
  const barcode = (req.query.code as string) || req.params.code;
  const result = await productService.lookupBarcode(barcode);
  res.json(result);
});

