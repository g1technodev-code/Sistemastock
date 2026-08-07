import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as dashboardService from "../services/dashboard.service";
import { serializeDecimals } from "../utils/serialize";

export const summary = catchAsync(async (req: Request, res: Response) => {
  const data = await dashboardService.getSummary(req.user?.localId);
  res.json(serializeDecimals(data));
});

