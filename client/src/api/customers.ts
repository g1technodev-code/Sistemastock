import { api } from "../lib/api";
import type { Customer, CustomerMovement, Paginated } from "../lib/types";

export type ListCustomersParams = {
  page?: number;
  limit?: number;
  q?: string;
};

export type CreateCustomerData = {
  name: string;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  creditLimit?: number | null;
};

export type UpdateCustomerData = Partial<CreateCustomerData> & {
  isActive?: boolean;
};

export async function listCustomers(params?: ListCustomersParams) {
  const { data } = await api.get<Paginated<Customer>>("/customers", { params });
  return data;
}

export async function getCustomer(id: string) {
  const { data } = await api.get<Customer & { movements: CustomerMovement[] }>(`/customers/${id}`);
  return data;
}

export async function createCustomer(input: CreateCustomerData) {
  const { data } = await api.post<Customer>("/customers", input);
  return data;
}

export async function updateCustomer(id: string, input: UpdateCustomerData) {
  const { data } = await api.patch<Customer>(`/customers/${id}`, input);
  return data;
}

export async function registerPayment(id: string, amount: number, note?: string) {
  const { data } = await api.post<CustomerMovement>(`/customers/${id}/payments`, { amount, note });
  return data;
}
