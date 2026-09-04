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

export async function listNotifications(
  userId: string | undefined,
  localId: string | null | undefined,
  query: { page?: number; limit?: number; unreadOnly?: boolean },
) {
  const pagination = parsePagination(query);

  // Fetch local notifications
  const notifWhere: Prisma.NotificationWhereInput = {
    ...(localId ? { localId } : {}),
    ...(query.unreadOnly ? { isRead: false } : {}),
  };

  const [localNotifs, unreadNotifCount, announcements, userReads] = await Promise.all([
    prisma.notification.findMany({
      where: notifWhere,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.notification.count({
      where: { ...(localId ? { localId } : {}), isRead: false },
    }),
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    userId
      ? prisma.userAnnouncementRead.findMany({
          where: { userId },
          select: { announcementId: true },
        })
      : Promise.resolve([]),
  ]);

  const readAnnouncementIds = new Set(userReads.map((r) => r.announcementId));

  // Format announcements as notification items
  const announcementItems = announcements.map((ann) => ({
    id: `announcement_${ann.id}`,
    announcementId: ann.id,
    localId: localId ?? "",
    type: `ANNOUNCEMENT_${ann.type}`,
    title: ann.title,
    message: ann.message,
    metadata: { isAnnouncement: true, announcementType: ann.type },
    isRead: readAnnouncementIds.has(ann.id),
    createdAt: ann.createdAt.toISOString(),
  }));

  const unreadAnnouncementsCount = announcements.filter((ann) => !readAnnouncementIds.has(ann.id)).length;

  const allItems = [...announcementItems, ...localNotifs.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return {
    items: allItems,
    unreadCount: unreadNotifCount + unreadAnnouncementsCount,
  };
}

export async function markAsRead(id?: string, userId?: string, localId?: string | null) {

  if (!id) {
    // Mark all local notifications as read and mark all announcements as read for this user
    await prisma.notification.updateMany({
      where: { ...(localId ? { localId } : {}), isRead: false },
      data: { isRead: true },
    });

    if (userId) {
      const allAnnouncements = await prisma.announcement.findMany({ select: { id: true } });
      const readData = allAnnouncements.map((a) => ({
        userId,
        announcementId: a.id,
      }));
      await prisma.userAnnouncementRead.createMany({
        data: readData,
        skipDuplicates: true,
      });
    }

    return { success: true };
  }

  if (id.startsWith("announcement_")) {
    const annId = id.replace("announcement_", "");
    if (userId) {
      await prisma.userAnnouncementRead.upsert({
        where: {
          userId_announcementId: { userId, announcementId: annId },
        },
        create: { userId, announcementId: annId },
        update: {},
      });
    }
    return { success: true };
  }

  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

