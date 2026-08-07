import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(["SUPERADMIN", "ADMIN", "MANAGER", "EMPLOYEE"]),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["SUPERADMIN", "ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
  isActive: z.boolean().optional(),
});


export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  q: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
