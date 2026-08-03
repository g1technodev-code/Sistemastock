import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as searchService from "../services/search.service";

export const search = catchAsync(async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "");
  const result = await searchService.globalSearch(q);
  res.json(result);
});
