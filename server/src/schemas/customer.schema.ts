import { z } from "zod";

const nullishString = z.string().transform((v) => (v.trim() === "" ? null : v.trim())).nullable().optional();
const optionalEmail = z
  .union([z.string().email("Email inválido"), z.literal(""), z.null(), z.undefined()])
  .transform((v) => (v === "" || !v ? null : v));

export const createCustomerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  taxId: nullishString,
  email: optionalEmail,
  phone: nullishString,
  address: nullishString,
  creditLimit: z.number().min(0, "El límite de crédito no puede ser negativo").nullable().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const registerPaymentSchema = z.object({
  amount: z.number().positive("El monto a abonar debe ser mayor a 0"),
  note: z.string().optional().nullable(),
});

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  q: z.string().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
