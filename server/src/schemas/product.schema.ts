import { z } from "zod";

export const upsertProductSchema = z.object({
  barcode: z.string().optional().nullable(),
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().optional().nullable(),
  unit: z.string().default("unidad"),
  costPrice: z.coerce.number().min(0),
  sellPrice: z.coerce.number().min(0),
  minStock: z.coerce.number().int().min(0).default(0),
  initialStock: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().optional().nullable(),
  saleType: z.enum(["UNIT", "WEIGHT", "AMOUNT"]).optional(),

  categoryId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  q: z.string().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  lowStock: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

export const bulkProductRowSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  cantidad: z.coerce.number().int().min(0).default(0),
  // Celda vacía = undefined, para que al actualizar un producto existente no se pise su precio con 0
  precio: z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.coerce.number().min(0).optional()),
});

export const priceUpdateSchema = z
  .object({
    categoryId: z.string().optional().nullable(),
    supplierId: z.string().optional().nullable(),
    percentage: z.coerce
      .number()
      .min(-90, "La baja no puede superar el 90%")
      .max(1000, "El aumento no puede superar el 1000%")
      .refine((v) => v !== 0, "El porcentaje no puede ser 0"),
    applyTo: z.enum(["SELL", "COST_AND_SELL"]).default("SELL"),
    rounding: z.coerce
      .number()
      .refine((v) => [0, 10, 50, 100].includes(v), "Redondeo inválido")
      .default(0),
  })
  .refine((v) => Boolean(v.categoryId || v.supplierId), "Elegí una categoría o un proveedor");

export type PriceUpdateInput = z.infer<typeof priceUpdateSchema>;
export type UpsertProductInput = z.infer<typeof upsertProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type BulkProductRow = z.infer<typeof bulkProductRowSchema>;
