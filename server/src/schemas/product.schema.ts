import { z } from "zod";

export const upsertProductSchema = z.object({
  sku: z.string().min(1, "El SKU es obligatorio"),
  barcode: z.string().optional().nullable(),
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().optional().nullable(),
  unit: z.string().default("unidad"),
  costPrice: z.coerce.number().min(0),
  sellPrice: z.coerce.number().min(0),
  minStock: z.coerce.number().int().min(0),
  imageUrl: z.string().optional().nullable(),
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

export type UpsertProductInput = z.infer<typeof upsertProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
