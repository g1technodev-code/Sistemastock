import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as inventoryCountsApi from "../api/inventoryCounts";
import type { ListInventoryCountsParams } from "../api/inventoryCounts";

export function useInventoryCounts(params: ListInventoryCountsParams) {
  return useQuery({
    queryKey: ["inventory-counts", params],
    queryFn: () => inventoryCountsApi.listInventoryCounts(params),
    placeholderData: (prev) => prev,
  });
}

export function useInventoryCount(id: string | null) {
  return useQuery({
    queryKey: ["inventory-count", id],
    queryFn: () => inventoryCountsApi.getInventoryCount(id as string),
    enabled: !!id,
  });
}

export function useInventoryCountMutations() {
  const qc = useQueryClient();
  const invalidateList = () => qc.invalidateQueries({ queryKey: ["inventory-counts"] });
  const invalidateSession = (id: string) => qc.invalidateQueries({ queryKey: ["inventory-count", id] });
  const invalidateStock = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["product"] });
    qc.invalidateQueries({ queryKey: ["low-stock-alerts"] });
    qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    qc.invalidateQueries({ queryKey: ["movements"] });
  };

  const createSession = useMutation({
    mutationFn: (note?: string | null) => inventoryCountsApi.createInventoryCount(note),
    onSuccess: invalidateList,
  });

  const upsertItem = useMutation({
    mutationFn: ({ id, productId, countedQuantity }: { id: string; productId: string; countedQuantity: number }) =>
      inventoryCountsApi.upsertInventoryCountItem(id, productId, countedQuantity),
    onSuccess: (session) => invalidateSession(session.id),
  });

  const removeItem = useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) => inventoryCountsApi.removeInventoryCountItem(id, productId),
    onSuccess: (session) => invalidateSession(session.id),
  });

  const confirm = useMutation({
    mutationFn: (id: string) => inventoryCountsApi.confirmInventoryCount(id),
    onSuccess: (session) => {
      invalidateSession(session.id);
      invalidateList();
      invalidateStock();
    },
  });

  return { createSession, upsertItem, removeItem, confirm };
}
