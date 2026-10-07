import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseOrdersApi, type PurchaseOrderInput, type ReceivePurchaseOrderInput } from "../api/purchaseOrders";
import type { PurchaseOrderStatus } from "../lib/types";

export function usePurchaseOrders(params?: { page?: number; limit?: number; supplierId?: string; status?: PurchaseOrderStatus; from?: string; to?: string }) {
  return useQuery({
    queryKey: ["purchaseOrders", params],
    queryFn: () => purchaseOrdersApi.list(params).then((res) => res.data),
    staleTime: 1000 * 60,
  });
}

export function usePurchaseOrder(id: string | null) {
  return useQuery({
    queryKey: ["purchaseOrder", id],
    queryFn: () => purchaseOrdersApi.get(id!).then((res) => res.data.purchaseOrder),
    enabled: !!id,
    staleTime: 1000 * 60,
  });
}

export function usePurchaseOrderMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: PurchaseOrderInput) => purchaseOrdersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: PurchaseOrderInput }) => purchaseOrdersApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      queryClient.invalidateQueries({ queryKey: ["purchaseOrder", variables.id] });
    },
  });

  const receive = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReceivePurchaseOrderInput }) => purchaseOrdersApi.receive(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      queryClient.invalidateQueries({ queryKey: ["purchaseOrder", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["cash"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return { create, update, receive };
}
