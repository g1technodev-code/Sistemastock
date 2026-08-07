import { api } from "../../../api/client";
import type { LocalItem, Paginated, SuperAdminMetrics } from "../../../lib/types";


export type ListLocalesParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
};

export async function getSuperAdminMetrics(): Promise<{ metrics: SuperAdminMetrics }> {
  const { data } = await api.get("/superadmin/metrics");
  return data;
}

export async function listLocales(params: ListLocalesParams): Promise<Paginated<LocalItem>> {
  const { data } = await api.get("/superadmin/locales", { params });
  return data;
}

export async function updateLocalStatus(id: string, status: "ACTIVE" | "SUSPENDED" | "DUE_SOON"): Promise<{ local: LocalItem }> {
  const { data } = await api.patch(`/superadmin/locales/${id}/status`, { status });
  return data;
}
