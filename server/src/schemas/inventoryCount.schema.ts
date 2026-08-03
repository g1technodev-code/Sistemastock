import { z } from "zod";

export const createInventoryCountSchema = z.object({
  note: z.string().optional().nullable(),
});

export const upsertItemSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  countedQuantity: z.coerce.number().int().min(0, "La cantidad no puede ser negativa"),
});

export const listInventoryCountsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  status: z.enum(["OPEN", "COMPLETED"]).optional(),
});

export type CreateInventoryCountInput = z.infer<typeof createInventoryCountSchema>;
export type UpsertItemInput = z.infer<typeof upsertItemSchema>;
export type ListInventoryCountsQuery = z.infer<typeof listInventoryCountsQuerySchema>;
