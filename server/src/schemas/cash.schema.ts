import { z } from "zod";

export const openShiftSchema = z.object({
  countedAmount: z.coerce.number().min(0, "El monto no puede ser negativo"),
  note: z.string().optional().nullable(),
});

export const closeShiftSchema = z.object({
  countedAmount: z.coerce.number().min(0, "El monto no puede ser negativo"),
  note: z.string().optional().nullable(),
});

export const createWithdrawalSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  note: z.string().min(1, "Indica el motivo del retiro"),
});

export const listShiftsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  userId: z.string().optional(),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const listCashMovementsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  type: z.enum(["SALE_IN", "WITHDRAWAL", "ADJUSTMENT"]).optional(),
  userId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const cashSummaryQuerySchema = z.object({
  date: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});


export type OpenShiftInput = z.infer<typeof openShiftSchema>;
export type CloseShiftInput = z.infer<typeof closeShiftSchema>;
export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
export type ListShiftsQuery = z.infer<typeof listShiftsQuerySchema>;
export type ListCashMovementsQuery = z.infer<typeof listCashMovementsQuerySchema>;
export type CashSummaryQuery = z.infer<typeof cashSummaryQuerySchema>;
