import { api } from "./client";
import type { Paginated, Product } from "../lib/types";

export type ProductInput = {
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  unit: string;
  costPrice: number;
  sellPrice: number;
  minStock: number;
  imageUrl?: string | null;
  categoryId?: string | null;
  supplierId?: string | null;
  isActive?: boolean;
};

export type ListProductsParams = {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  supplierId?: string;
  lowStock?: boolean;
  isActive?: boolean;
};

export async function listProducts(params: ListProductsParams): Promise<Paginated<Product>> {
  const { data } = await api.get("/products", { params });
  return data;
}

export async function getProduct(id: string): Promise<Product> {
  const { data } = await api.get(`/products/${id}`);
  return data.product;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data } = await api.post("/products", input);
  return data.product;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const { data } = await api.patch(`/products/${id}`, input);
  return data.product;
}

export async function deleteProduct(id: string): Promise<{ softDeleted: boolean }> {
  const { data } = await api.delete(`/products/${id}`);
  return data;
}

export async function lookupBarcode(code: string): Promise<{ found: boolean; name?: string; description?: string }> {
  const { data } = await api.get("/products/barcode-lookup", { params: { code } });
  return data;
}

