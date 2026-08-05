import type { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { parsePagination, paginatedResponse } from "../utils/pagination";

export async function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, unknown>,
) {
  return prisma.notification.create({
    data: {
      type,
      title,
      message,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function listNotifications(query: { page?: number; limit?: number; unreadOnly?: boolean }) {
  const pagination = parsePagination(query);
  const where: Prisma.NotificationWhereInput = {};
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
    prisma.notification.count({ where: { isRead: false } }),
  ]);

  return {
    ...paginatedResponse(items, total, pagination),
    unreadCount,
  };
}

export async function markAsRead(id?: string) {
  if (id) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  return prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });
}
