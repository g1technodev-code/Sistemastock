import { api } from "../lib/api";
import type { NotificationItem, Paginated } from "../lib/types";

export type ListNotificationsParams = {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
};

export type NotificationsResponse = Paginated<NotificationItem> & {
  unreadCount: number;
};

export async function listNotifications(params?: ListNotificationsParams) {
  const { data } = await api.get<NotificationsResponse>("/notifications", { params });
  return data;
}

export async function markNotificationAsRead(id: string) {
  const { data } = await api.patch<{ success: boolean }>(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsAsRead() {
  const { data } = await api.patch<{ success: boolean }>("/notifications/read-all");
  return data;
}
