import { z } from "zod";

export const upsertSupplierSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  contactName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpsertSupplierInput = z.infer<typeof upsertSupplierSchema>;

export const supplierPaymentSchema = z.object({
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  paymentMethod: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA"]).default("EFECTIVO"),
  note: z.string().optional().nullable(),
});

export type SupplierPaymentInput = z.infer<typeof supplierPaymentSchema>;

export const listSupplierMovementsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export type ListSupplierMovementsQuery = z.infer<typeof listSupplierMovementsQuerySchema>;
