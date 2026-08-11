import { z } from "zod";

export const upsertPlanSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().optional().nullable(),
  monthlyPrice: z.number().min(0),
  maxAdmins: z.number().int().min(1),
  maxEmployees: z.number().int().min(0),
  isTrial: z.boolean().optional(),
  trialDays: z.number().int().min(1).optional().nullable(),
  isRecommended: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  features: z.array(z.string()).optional(),
});

export type UpsertPlanInput = z.infer<typeof upsertPlanSchema>;
