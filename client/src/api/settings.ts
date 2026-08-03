import { api } from "./client";
import type { BusinessSettings } from "../lib/types";

export type UpdateSettingsInput = {
  businessName: string;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
};

export async function getSettings(): Promise<BusinessSettings> {
  const { data } = await api.get("/settings");
  return data.settings;
}

export async function updateSettings(input: UpdateSettingsInput): Promise<BusinessSettings> {
  const { data } = await api.put("/settings", input);
  return data.settings;
}
