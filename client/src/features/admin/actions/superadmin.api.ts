import { api } from "../../../api/client";
import type { ConversionAlert, LocalItem, Paginated, SuperAdminMetrics } from "../../../lib/types";

export type ListLocalesParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
};

export type CreateLocalParams = {
  name: string;
  ownerEmail: string;
  adminPassword: string;
  plan: "TRIAL" | "BASICO" | "PRO";
};

export async function getSuperAdminMetrics(): Promise<{ metrics: SuperAdminMetrics; conversionAlerts: ConversionAlert[] }> {
  const { data } = await api.get("/superadmin/metrics");
  return data;
}

export async function listLocales(params: ListLocalesParams): Promise<Paginated<LocalItem>> {
  const { data } = await api.get("/superadmin/locales", { params });
  return data;
}

export async function createLocal(params: CreateLocalParams): Promise<{ local: LocalItem }> {
  const { data } = await api.post("/superadmin/locales", params);
  return data;
}

export async function updateLocalStatus(id: string, status: "ACTIVE" | "SUSPENDED" | "DUE_SOON"): Promise<{ local: LocalItem }> {
  const { data } = await api.patch(`/superadmin/locales/${id}/status`, { status });
  return data;
}

