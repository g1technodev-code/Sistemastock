import { z } from "zod";

export const createSaleSchema = z
  .object({
    paymentMethod: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA"]),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, "Selecciona un producto"),
          quantity: z.coerce.number().int().min(1, "La cantidad debe ser mayor a 0"),
        }),
      )
      .min(1, "Agrega al menos un producto al carrito"),
    receiptNumber: z.string().optional().nullable(),
    payerName: z.string().optional().nullable(),
  })
  .refine((data) => data.paymentMethod === "EFECTIVO" || !!data.receiptNumber?.trim(), {
    message: "Indica el número de comprobante",
    path: ["receiptNumber"],
  })
  .refine((data) => data.paymentMethod === "EFECTIVO" || !!data.payerName?.trim(), {
    message: "Indica el nombre de quien pagó",
    path: ["payerName"],
  });

export const listSalesQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  userId: z.string().optional(),
  paymentMethod: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const salesSummaryQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  userId: z.string().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type ListSalesQuery = z.infer<typeof listSalesQuerySchema>;
export type SalesSummaryQuery = z.infer<typeof salesSummaryQuerySchema>;
