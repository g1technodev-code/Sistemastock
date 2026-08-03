import { z } from "zod";

export const createMovementSchema = z
  .object({
    productId: z.string().min(1, "Selecciona un producto"),
    type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
    quantity: z.coerce.number().int().min(0, "La cantidad no puede ser negativa"),
    reason: z.string().optional().nullable(),
    reference: z.string().optional().nullable(),
  })
  .refine((data) => data.type === "ADJUSTMENT" || data.quantity > 0, {
    message: "La cantidad debe ser mayor a 0",
    path: ["quantity"],
  });

export const listMovementsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  productId: z.string().optional(),
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]).optional(),
  userId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreateMovementInput = z.infer<typeof createMovementSchema>;
export type ListMovementsQuery = z.infer<typeof listMovementsQuerySchema>;
