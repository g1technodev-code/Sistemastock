import { api } from "./client";
import type { CashMovement, CashMovementType, CashRegisterStatus, CashShift, CashShiftStatus, CashSummary, Paginated } from "../lib/types";

export type OpenShiftInput = { countedAmount: number; note?: string | null };
export type CloseShiftInput = { countedAmount: number; note?: string | null };
export type CreateWithdrawalInput = { amount: number; note: string };

export type ListShiftsParams = {
  page?: number;
  limit?: number;
  userId?: string;
  status?: CashShiftStatus;
  from?: string;
  to?: string;
};

export type ListCashMovementsParams = {
  page?: number;
  limit?: number;
  type?: CashMovementType;
  from?: string;
  to?: string;
};

export type CashSummaryParams = { from?: string; to?: string };

export async function getCashStatus(): Promise<CashRegisterStatus> {
  const { data } = await api.get("/cash/status");
  return data;
}

export async function getCashSummary(params: CashSummaryParams = {}): Promise<CashSummary> {
  const { data } = await api.get("/cash/summary", { params });
  return data;
}

export async function openShift(input: OpenShiftInput): Promise<CashShift> {
  const { data } = await api.post("/cash/shifts/open", input);
  return data.shift;
}

export async function closeShift(id: string, input: CloseShiftInput): Promise<CashShift> {
  const { data } = await api.post(`/cash/shifts/${id}/close`, input);
  return data.shift;
}

export async function listShifts(params: ListShiftsParams): Promise<Paginated<CashShift>> {
  const { data } = await api.get("/cash/shifts", { params });
  return data;
}

export async function createWithdrawal(input: CreateWithdrawalInput): Promise<CashMovement> {
  const { data } = await api.post("/cash/withdrawals", input);
  return data.movement;
}

export async function listWithdrawals(params: ListCashMovementsParams): Promise<Paginated<CashMovement>> {
  const { data } = await api.get("/cash/withdrawals", { params });
  return data;
}

export async function listCashMovements(params: ListCashMovementsParams): Promise<Paginated<CashMovement>> {
  const { data } = await api.get("/cash/movements", { params });
  return data;
}
