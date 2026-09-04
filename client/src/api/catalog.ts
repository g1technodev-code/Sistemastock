import { api } from "./client";
import type { CatalogProduct, Product } from "../lib/types";

export type ImportCatalogProductInput = {
  categoryId?: string | null;
};

export async function browseCatalog(): Promise<CatalogProduct[]> {
  const { data } = await api.get("/products/catalog");
  return data.items;
}

export async function importCatalogProduct(id: string, input: ImportCatalogProductInput): Promise<Product> {
  const { data } = await api.post(`/products/catalog/${id}/import`, input);
  return data.product;
}
