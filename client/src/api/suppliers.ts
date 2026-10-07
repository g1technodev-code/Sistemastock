import { api } from "./client";
import type { Supplier } from "../lib/types";

export type SupplierInput = {
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

export async function listSuppliers(): Promise<Supplier[]> {
  const { data } = await api.get("/suppliers");
  return data.items;
}

export async function createSupplier(input: SupplierInput): Promise<Supplier> {
  const { data } = await api.post("/suppliers", input);
  return data.supplier;
}

export async function updateSupplier(id: string, input: SupplierInput): Promise<Supplier> {
  const { data } = await api.patch(`/suppliers/${id}`, input);
  return data.supplier;
}

export async function deleteSupplier(id: string): Promise<void> {
  await api.delete(`/suppliers/${id}`);
}

import type { SupplierMovement, Paginated, PaymentMethod } from "../lib/types";

export type SupplierPaymentInput = {
  amount: number;
  paymentMethod: PaymentMethod;
  note?: string | null;
};

export async function getSupplierAccount(id: string): Promise<Supplier & { movements: SupplierMovement[] }> {
  const { data } = await api.get(`/suppliers/${id}/account`);
  return data.supplier;
}

export async function listSupplierMovements(id: string, params?: { page?: number; limit?: number }): Promise<Paginated<SupplierMovement>> {
  const { data } = await api.get(`/suppliers/${id}/movements`, { params });
  return data;
}

export async function registerSupplierPayment(id: string, input: SupplierPaymentInput): Promise<SupplierMovement> {
  const { data } = await api.post(`/suppliers/${id}/payments`, input);
  return data.movement;
}

