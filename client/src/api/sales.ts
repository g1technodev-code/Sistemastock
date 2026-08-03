import { api } from "./client";
import type { Paginated, PaymentMethod, Sale, SalesSummary } from "../lib/types";

export type CreateSaleInput = {
  paymentMethod: PaymentMethod;
  items: { productId: string; quantity: number }[];
};

export type ListSalesParams = {
  page?: number;
  limit?: number;
  userId?: string;
  paymentMethod?: PaymentMethod;
  from?: string;
  to?: string;
};

export type SalesSummaryParams = {
  from?: string;
  to?: string;
  userId?: string;
};

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  const { data } = await api.post("/sales", input);
  return data.sale;
}

export async function listSales(params: ListSalesParams): Promise<Paginated<Sale>> {
  const { data } = await api.get("/sales", { params });
  return data;
}

export async function getSale(id: string): Promise<Sale> {
  const { data } = await api.get(`/sales/${id}`);
  return data.sale;
}

export async function getSalesSummary(params: SalesSummaryParams = {}): Promise<SalesSummary> {
  const { data } = await api.get("/sales/summary", { params });
  return data;
}
