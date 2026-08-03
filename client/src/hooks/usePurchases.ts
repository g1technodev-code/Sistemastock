import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as purchasesApi from "../api/purchases";
import type { ListPurchasesParams, PurchaseInput } from "../api/purchases";

export function usePurchases(params: ListPurchasesParams) {
  return useQuery({
    queryKey: ["purchases", params],
    queryFn: () => purchasesApi.listPurchases(params),
    placeholderData: (prev) => prev,
  });
}

export function usePurchase(id: string | null) {
  return useQuery({
    queryKey: ["purchase", id],
    queryFn: () => purchasesApi.getPurchase(id as string),
    enabled: !!id,
  });
}

function useInvalidatePurchases() {
  const qc = useQueryClient();
  return (id?: string) => {
    qc.invalidateQueries({ queryKey: ["purchases"] });
    if (id) qc.invalidateQueries({ queryKey: ["purchase", id] });
  };
}

function useInvalidateStockEffects() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["product"] });
    qc.invalidateQueries({ queryKey: ["low-stock-alerts"] });
    qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    qc.invalidateQueries({ queryKey: ["movements"] });
  };
}

export function usePurchaseMutations() {
  const invalidate = useInvalidatePurchases();
  const invalidateStock = useInvalidateStockEffects();

  const create = useMutation({
    mutationFn: (input: PurchaseInput) => purchasesApi.createPurchase(input),
    onSuccess: () => invalidate(),
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: PurchaseInput }) => purchasesApi.updatePurchase(id, input),
    onSuccess: (purchase) => invalidate(purchase.id),
  });
  const receive = useMutation({
    mutationFn: (id: string) => purchasesApi.receivePurchase(id),
    onSuccess: (purchase) => {
      invalidate(purchase.id);
      invalidateStock();
    },
  });
  const cancel = useMutation({
    mutationFn: (id: string) => purchasesApi.cancelPurchase(id),
    onSuccess: (purchase) => invalidate(purchase.id),
  });

  return { create, update, receive, cancel };
}
