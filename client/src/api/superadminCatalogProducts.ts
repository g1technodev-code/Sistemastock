import { api } from "./client";
import { downloadBlob } from "../lib/download";
import type { CatalogProduct, BulkRowResult } from "../lib/types";

export type CatalogProductInput = {
  rubroId: string;
  name: string;
  description?: string | null;
  unit: string;
  imageUrl?: string | null;
  barcode?: string | null;
  isActive?: boolean;
};

export async function listCatalogProducts(rubroId?: string, includeInactive = true): Promise<CatalogProduct[]> {
  const { data } = await api.get("/superadmin/catalog-products", { params: { rubroId, includeInactive } });
  return data.items;
}

export async function createCatalogProduct(input: CatalogProductInput): Promise<CatalogProduct> {
  const { data } = await api.post("/superadmin/catalog-products", input);
  return data.catalogProduct;
}

export async function updateCatalogProduct(id: string, input: CatalogProductInput): Promise<CatalogProduct> {
  const { data } = await api.patch(`/superadmin/catalog-products/${id}`, input);
  return data.catalogProduct;
}

export async function deleteCatalogProduct(id: string): Promise<void> {
  await api.delete(`/superadmin/catalog-products/${id}`);
}

export async function downloadCatalogProductTemplate(): Promise<void> {
  const response = await api.get("/superadmin/catalog-products/bulk/template", { responseType: "blob" });
  downloadBlob(response.data, "plantilla-catalogo.xlsx");
}

export async function bulkUploadCatalogProducts(file: File): Promise<BulkRowResult[]> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/superadmin/catalog-products/bulk", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.results;
}
