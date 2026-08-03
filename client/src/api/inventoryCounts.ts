import { api } from "./client";
import type { InventoryCount, InventoryCountStatus, Paginated } from "../lib/types";

export type ListInventoryCountsParams = {
  page?: number;
  limit?: number;
  status?: InventoryCountStatus;
};

export async function listInventoryCounts(params: ListInventoryCountsParams): Promise<Paginated<InventoryCount>> {
  const { data } = await api.get("/inventory-counts", { params });
  return data;
}

export async function getInventoryCount(id: string): Promise<InventoryCount> {
  const { data } = await api.get(`/inventory-counts/${id}`);
  return data.session;
}

export async function createInventoryCount(note?: string | null): Promise<InventoryCount> {
  const { data } = await api.post("/inventory-counts", { note });
  return data.session;
}

export async function upsertInventoryCountItem(id: string, productId: string, countedQuantity: number): Promise<InventoryCount> {
  const { data } = await api.put(`/inventory-counts/${id}/items`, { productId, countedQuantity });
  return data.session;
}

export async function removeInventoryCountItem(id: string, productId: string): Promise<InventoryCount> {
  const { data } = await api.delete(`/inventory-counts/${id}/items/${productId}`);
  return data.session;
}

export async function confirmInventoryCount(id: string): Promise<InventoryCount> {
  const { data } = await api.post(`/inventory-counts/${id}/confirm`);
  return data.session;
}
