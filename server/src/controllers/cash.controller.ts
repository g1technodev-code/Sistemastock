import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as cashService from "../services/cash.service";
import {
  openShiftSchema,
  closeShiftSchema,
  createWithdrawalSchema,
  listShiftsQuerySchema,
  listCashMovementsQuerySchema,
  cashSummaryQuerySchema,
} from "../schemas/cash.schema";
import { serializeDecimals } from "../utils/serialize";

export const getStatus = catchAsync(async (req: Request, res: Response) => {
  const status = await cashService.getStatus(req.user?.localId, req.user!.id);
  res.json(serializeDecimals(status));
});

export const getSummary = catchAsync(async (req: Request, res: Response) => {
  const query = cashSummaryQuerySchema.parse(req.query);
  const summary = await cashService.getSummary(req.user?.localId, query);
  res.json(serializeDecimals(summary));
});

export const openShift = catchAsync(async (req: Request, res: Response) => {
  const input = openShiftSchema.parse(req.body);
  const shift = await cashService.openShift(req.user?.localId, input, req.user!.id);
  res.status(201).json({ shift: serializeDecimals(shift) });
});

export const closeShift = catchAsync(async (req: Request, res: Response) => {
  const input = closeShiftSchema.parse(req.body);
  const shift = await cashService.closeShift(req.user?.localId, req.params.id, input, req.user!.id, req.user!.role);
  res.json({ shift: serializeDecimals(shift) });
});

export const listShifts = catchAsync(async (req: Request, res: Response) => {
  const query = listShiftsQuerySchema.parse(req.query);
  if (req.user!.role === "EMPLOYEE") {
    query.userId = req.user!.id;
  }
  const result = await cashService.listShifts(req.user?.localId, query);
  res.json(serializeDecimals(result));
});

export const createWithdrawal = catchAsync(async (req: Request, res: Response) => {
  const input = createWithdrawalSchema.parse(req.body);
  const movement = await cashService.createWithdrawal(req.user?.localId, input, req.user!.id);
  res.status(201).json({ movement: serializeDecimals(movement) });
});

export const listWithdrawals = catchAsync(async (req: Request, res: Response) => {
  const query = listCashMovementsQuerySchema.parse(req.query);
  const result = await cashService.listWithdrawals(req.user?.localId, query);
  res.json(serializeDecimals(result));
});

export const listMovements = catchAsync(async (req: Request, res: Response) => {
  const query = listCashMovementsQuerySchema.parse(req.query);
  const result = await cashService.listCashMovements(req.user?.localId, query);
  res.json(serializeDecimals(result));
});

