import { z } from "zod";

export const upsertCatalogProductSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().optional().nullable(),
  unit: z.string().default("unidad"),
  imageUrl: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const listCatalogProductsQuerySchema = z.object({
  includeInactive: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export const importCatalogProductSchema = z.object({
  categoryId: z.string().optional().nullable(),
});

export const bulkCatalogProductRowSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
});

export type UpsertCatalogProductInput = z.infer<typeof upsertCatalogProductSchema>;
export type ListCatalogProductsQuery = z.infer<typeof listCatalogProductsQuerySchema>;
export type ImportCatalogProductInput = z.infer<typeof importCatalogProductSchema>;
export type BulkCatalogProductRow = z.infer<typeof bulkCatalogProductRowSchema>;
