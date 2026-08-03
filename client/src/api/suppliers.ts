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
