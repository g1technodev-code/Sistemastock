import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as notificationService from "../services/notification.service";
import { z } from "zod";

const listQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  unreadOnly: z.coerce.boolean().optional(),
});

export const list = catchAsync(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  const result = await notificationService.listNotifications(req.user?.localId, query);
  res.json(result);
});


export const markRead = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  await notificationService.markAsRead(req.user?.localId, id);
  res.json({ success: true });
});

export const markAllRead = catchAsync(async (req: Request, res: Response) => {
  await notificationService.markAsRead(req.user?.localId);
  res.json({ success: true });
});
