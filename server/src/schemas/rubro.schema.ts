import { z } from "zod";

export const upsertRubroSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type UpsertRubroInput = z.infer<typeof upsertRubroSchema>;
