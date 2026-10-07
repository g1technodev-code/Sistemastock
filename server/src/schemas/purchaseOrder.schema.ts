import { z } from "zod";

const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  quantity: z.coerce.number().int().min(1, "La cantidad debe ser mayor a 0"),
  estimatedUnitPrice: z.coerce.number().min(0, "El costo no puede ser negativo"),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Selecciona un proveedor"),
  items: z.array(purchaseOrderItemSchema).min(1, "Agrega al menos un producto"),
  notes: z.string().optional().nullable(),
});

export const updatePurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Selecciona un proveedor"),
  items: z.array(purchaseOrderItemSchema).min(1, "Agrega al menos un producto"),
  notes: z.string().optional().nullable(),
});

export const listPurchaseOrdersQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  supplierId: z.string().optional(),
  status: z.enum(["PENDING", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const receivePurchaseOrderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  receivedQuantity: z.coerce.number().int().min(0),
  actualUnitCost: z.coerce.number().min(0),
});

export const receivePurchaseOrderSchema = z.object({
  items: z.array(receivePurchaseOrderItemSchema).min(1),
  paymentMethod: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA", "CUENTA_CORRIENTE"]).optional().nullable(),
  receiptNumber: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type ListPurchaseOrdersQuery = z.infer<typeof listPurchaseOrdersQuerySchema>;
export type ReceivePurchaseOrderInput = z.infer<typeof receivePurchaseOrderSchema>;
