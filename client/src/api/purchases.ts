import { api } from "./client";
import type { Paginated, Purchase, PurchaseStatus } from "../lib/types";

export type PurchaseItemInput = {
  productId: string;
  quantity: number;
  unitCost: number;
};

export type PurchaseInput = {
  supplierId: string;
  items: PurchaseItemInput[];
  note?: string | null;
};

export type ListPurchasesParams = {
  page?: number;
  limit?: number;
  supplierId?: string;
  status?: PurchaseStatus;
  from?: string;
  to?: string;
};

export async function listPurchases(params: ListPurchasesParams): Promise<Paginated<Purchase>> {
  const { data } = await api.get("/purchases", { params });
  return data;
}

export async function getPurchase(id: string): Promise<Purchase> {
  const { data } = await api.get(`/purchases/${id}`);
  return data.purchase;
}

export async function createPurchase(input: PurchaseInput): Promise<Purchase> {
  const { data } = await api.post("/purchases", input);
  return data.purchase;
}

export async function updatePurchase(id: string, input: PurchaseInput): Promise<Purchase> {
  const { data } = await api.patch(`/purchases/${id}`, input);
  return data.purchase;
}

export async function receivePurchase(id: string): Promise<Purchase> {
  const { data } = await api.post(`/purchases/${id}/receive`);
  return data.purchase;
}

export async function cancelPurchase(id: string): Promise<Purchase> {
  const { data } = await api.post(`/purchases/${id}/cancel`);
  return data.purchase;
}
