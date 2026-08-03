import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as settingsService from "../services/settings.service";
import { updateSettingsSchema } from "../schemas/settings.schema";

export const getSettings = catchAsync(async (_req: Request, res: Response) => {
  const settings = await settingsService.getSettings();
  res.json({ settings });
});

export const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const input = updateSettingsSchema.parse(req.body);
  const settings = await settingsService.updateSettings(input);
  res.json({ settings });
});
