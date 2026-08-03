import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as salesApi from "../api/sales";
import type { CreateSaleInput, ListSalesParams, SalesSummaryParams } from "../api/sales";

export function useSales(params: ListSalesParams) {
  return useQuery({
    queryKey: ["sales", params],
    queryFn: () => salesApi.listSales(params),
    placeholderData: (prev) => prev,
  });
}

export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: ["sale", id],
    queryFn: () => salesApi.getSale(id!),
    enabled: !!id,
  });
}

export function useSalesSummary(params: SalesSummaryParams = {}) {
  return useQuery({
    queryKey: ["sales-summary", params],
    queryFn: () => salesApi.getSalesSummary(params),
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleInput) => salesApi.createSale(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["sales-summary"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product"] });
      qc.invalidateQueries({ queryKey: ["low-stock-alerts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      // A sale can affect the cash register (EFECTIVO) — always refresh, simpler
      // and safer than conditioning the invalidation on the chosen payment method.
      qc.invalidateQueries({ queryKey: ["cash-status"] });
      qc.invalidateQueries({ queryKey: ["cash-summary"] });
    },
  });
}
