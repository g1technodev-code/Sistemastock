import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { parsePagination, paginatedResponse } from "../utils/pagination";

export async function createNotification(
  localId: string | null | undefined,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, unknown>,
) {
  if (!localId) return null;
  return prisma.notification.create({
    data: {
      localId,
      type,
      title,
      message,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function listNotifications(localId: string | null | undefined, query: { page?: number; limit?: number; unreadOnly?: boolean }) {
  const pagination = parsePagination(query);
  const where: Prisma.NotificationWhereInput = {
    ...(localId ? { localId } : {}),
  };
  if (query.unreadOnly) {
    where.isRead = false;
  }

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...(localId ? { localId } : {}), isRead: false } }),
  ]);

  return {
    ...paginatedResponse(items, total, pagination),
    unreadCount,
  };
}


export async function markAsRead(localId: string | null | undefined, id?: string) {
  if (id) {
    const existing = await prisma.notification.findFirst({
      where: { id, ...(localId ? { localId } : {}) },
    });
    if (!existing) return null;
    return prisma.notification.update({
      where: { id: existing.id },
      data: { isRead: true },
    });
  }

  return prisma.notification.updateMany({
    where: { isRead: false, ...(localId ? { localId } : {}) },
    data: { isRead: true },
  });
}
