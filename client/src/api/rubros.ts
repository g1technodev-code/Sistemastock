import { api } from "./client";
import type { Rubro } from "../lib/types";

export async function listPublicRubros(): Promise<Rubro[]> {
  const { data } = await api.get("/rubros");
  return data.items;
}
