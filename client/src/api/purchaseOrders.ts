import { api } from "./client";
import type { PurchaseOrder, Paginated, PurchaseOrderStatus, PaymentMethod } from "../lib/types";

export type PurchaseOrderItemInput = {
  productId: string;
  quantity: number;
  estimatedUnitPrice: number;
};

export type PurchaseOrderInput = {
  supplierId: string;
  items: PurchaseOrderItemInput[];
  notes?: string;
};

export type ReceivePurchaseOrderItemInput = {
  id: string; // The purchaseOrderItemId
  productId: string;
  receivedQuantity: number;
  actualUnitCost: number;
};

export type ReceivePurchaseOrderInput = {
  items: ReceivePurchaseOrderItemInput[];
  paymentMethod?: PaymentMethod | null;
  receiptNumber?: string | null;
  note?: string | null;
};

export const purchaseOrdersApi = {
  list: (params?: { page?: number; limit?: number; supplierId?: string; status?: PurchaseOrderStatus; from?: string; to?: string }) =>
    api.get<Paginated<PurchaseOrder>>("/purchase-orders", { params }),

  get: (id: string) => api.get<{ purchaseOrder: PurchaseOrder }>(`/purchase-orders/${id}`),

  create: (data: PurchaseOrderInput) => api.post<{ purchaseOrder: PurchaseOrder }>("/purchase-orders", data),

  update: (id: string, data: PurchaseOrderInput) => api.patch<{ purchaseOrder: PurchaseOrder }>(`/purchase-orders/${id}`, data),

  receive: (id: string, data: ReceivePurchaseOrderInput) => api.post(`/purchase-orders/${id}/receive`, data),
};
