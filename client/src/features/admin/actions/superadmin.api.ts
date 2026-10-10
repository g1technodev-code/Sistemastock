import { api } from "../../../api/client";
import type { Announcement, ConversionAlert, LocalItem, Paginated, SuperAdminMetrics, SuperAdminUser } from "../../../lib/types";


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
  planId: string;
  rubroId?: string;
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

export async function updateLocalPlan(id: string, planId: string): Promise<LocalItem> {
  const { data } = await api.patch(`/superadmin/locales/${id}/plan`, { planId });
  return data;
}

export async function updateLocalRubro(id: string, rubroId: string | null): Promise<LocalItem> {
  const { data } = await api.patch(`/superadmin/locales/${id}/rubro`, { rubroId });
  return data;
}

export async function deleteLocal(id: string): Promise<void> {
  await api.delete(`/superadmin/locales/${id}`);
}

export type ListUsersParams = {
  page?: number;
  limit?: number;
  q?: string;
  localId?: string;
  role?: string;
  isActive?: "true" | "false";
};

export async function listAllUsers(params: ListUsersParams): Promise<Paginated<SuperAdminUser>> {
  const { data } = await api.get("/superadmin/users", { params });
  return data;
}

export async function updateUserStatus(id: string, isActive: boolean): Promise<{ user: SuperAdminUser }> {
  const { data } = await api.patch(`/superadmin/users/${id}/status`, { isActive });
  return data;
}

export async function resetUserPassword(id: string): Promise<{ temporaryPassword: string }> {
  const { data } = await api.post(`/superadmin/users/${id}/reset-password`);
  return data;
}

export async function revokeUserSessions(id: string): Promise<void> {
  await api.post(`/superadmin/users/${id}/revoke-sessions`);
}

export async function listAnnouncements(): Promise<{ items: Announcement[] }> {
  const { data } = await api.get("/superadmin/announcements");
  return data;
}

export async function createAnnouncement(params: { title: string; message: string; type?: "INFO" | "WARNING" | "MAINTENANCE" }): Promise<Announcement> {
  const { data } = await api.post("/superadmin/announcements", params);
  return data;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await api.delete(`/superadmin/announcements/${id}`);
}

export async function getLatestAnnouncement(): Promise<{ announcement: Announcement | null }> {
  const { data } = await api.get("/announcements/latest");
  return data;
}

