import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as cashApi from "../api/cash";
import type {
  CloseShiftInput,
  CreateWithdrawalInput,
  ListCashMovementsParams,
  ListShiftsParams,
  OpenShiftInput,
  CashSummaryParams,
} from "../api/cash";

export function useCashStatus() {
  return useQuery({
    queryKey: ["cash-status"],
    queryFn: () => cashApi.getCashStatus(),
  });
}

export function useCashSummary(params: CashSummaryParams = {}) {
  return useQuery({
    queryKey: ["cash-summary", params],
    queryFn: () => cashApi.getCashSummary(params),
  });
}

export function useShifts(params: ListShiftsParams) {
  return useQuery({
    queryKey: ["cash-shifts", params],
    queryFn: () => cashApi.listShifts(params),
    placeholderData: (prev) => prev,
  });
}

export function useWithdrawals(params: ListCashMovementsParams) {
  return useQuery({
    queryKey: ["cash-withdrawals", params],
    queryFn: () => cashApi.listWithdrawals(params),
    placeholderData: (prev) => prev,
  });
}

export function useCashMovements(params: ListCashMovementsParams) {
  return useQuery({
    queryKey: ["cash-movements", params],
    queryFn: () => cashApi.listCashMovements(params),
    placeholderData: (prev) => prev,
  });
}

export function useOpenShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OpenShiftInput) => cashApi.openShift(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-status"] });
      qc.invalidateQueries({ queryKey: ["cash-shifts"] });
    },
  });
}

export function useCloseShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CloseShiftInput }) => cashApi.closeShift(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-status"] });
      qc.invalidateQueries({ queryKey: ["cash-shifts"] });
    },
  });
}

export function useCreateWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWithdrawalInput) => cashApi.createWithdrawal(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-status"] });
      qc.invalidateQueries({ queryKey: ["cash-summary"] });
      qc.invalidateQueries({ queryKey: ["cash-withdrawals"] });
      qc.invalidateQueries({ queryKey: ["cash-movements"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}
