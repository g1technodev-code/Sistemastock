import { api } from "./client";
import type { Category } from "../lib/types";

export type CategoryInput = {
  name: string;
  description?: string | null;
  color?: string | null;
  isActive?: boolean;
};

export async function listCategories(): Promise<Category[]> {
  const { data } = await api.get("/categories");
  return data.items;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const { data } = await api.post("/categories", input);
  return data.category;
}

export async function updateCategory(id: string, input: CategoryInput): Promise<Category> {
  const { data } = await api.patch(`/categories/${id}`, input);
  return data.category;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}
