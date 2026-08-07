import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as stockService from "../services/stock.service";
import { createMovementSchema, listMovementsQuerySchema } from "../schemas/stock.schema";
import { serializeDecimals } from "../utils/serialize";

export const createMovement = catchAsync(async (req: Request, res: Response) => {
  const input = createMovementSchema.parse(req.body);
  const movement = await stockService.createMovement(req.user?.localId, input, req.user!.id);
  res.status(201).json({ movement: serializeDecimals(movement) });
});

export const listMovements = catchAsync(async (req: Request, res: Response) => {
  const query = listMovementsQuerySchema.parse(req.query);
  if (req.user!.role === "EMPLOYEE") {
    query.userId = req.user!.id;
  }
  const result = await stockService.listMovements(req.user?.localId, query);
  res.json(serializeDecimals(result));
});

