import { z } from "zod";

export const updateSettingsSchema = z.object({
  businessName: z.string().min(2, "El nombre es muy corto"),
  taxId: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  logoUrl: z.string().optional().nullable(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
