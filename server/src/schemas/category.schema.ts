import { z } from "zod";

export const upsertCategorySchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpsertCategoryInput = z.infer<typeof upsertCategorySchema>;
