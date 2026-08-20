import { api } from "./client";
import type { Rubro } from "../lib/types";

export type RubroInput = {
  name: string;
  description?: string | null;
  icon?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export async function listRubros(includeInactive = true): Promise<Rubro[]> {
  const { data } = await api.get("/superadmin/rubros", { params: { includeInactive } });
  return data.items;
}

export async function createRubro(input: RubroInput): Promise<Rubro> {
  const { data } = await api.post("/superadmin/rubros", input);
  return data.rubro;
}

export async function updateRubro(id: string, input: RubroInput): Promise<Rubro> {
  const { data } = await api.patch(`/superadmin/rubros/${id}`, input);
  return data.rubro;
}

export async function deleteRubro(id: string): Promise<void> {
  await api.delete(`/superadmin/rubros/${id}`);
}
