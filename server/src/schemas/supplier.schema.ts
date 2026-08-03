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
