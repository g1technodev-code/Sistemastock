import { api } from "./client";

export type GlobalSearchResult = {
  products: { id: string; name: string; sku: string; currentStock: number; minStock: number }[];
  categories: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
};

export async function globalSearch(q: string): Promise<GlobalSearchResult> {
  const { data } = await api.get("/search", { params: { q } });
  return data;
}
