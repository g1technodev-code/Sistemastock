import { z } from "zod";

const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  quantity: z.coerce.number().int().min(1, "La cantidad debe ser mayor a 0"),
  unitCost: z.coerce.number().min(0, "El costo no puede ser negativo"),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().min(1, "Selecciona un proveedor"),
  items: z.array(purchaseItemSchema).min(1, "Agrega al menos un producto"),
  note: z.string().optional().nullable(),
});

export const updatePurchaseSchema = z.object({
  supplierId: z.string().min(1, "Selecciona un proveedor"),
  items: z.array(purchaseItemSchema).min(1, "Agrega al menos un producto"),
  note: z.string().optional().nullable(),
});

export const listPurchasesQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  supplierId: z.string().optional(),
  status: z.enum(["PENDING", "RECEIVED", "CANCELLED"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;
export type ListPurchasesQuery = z.infer<typeof listPurchasesQuerySchema>;
