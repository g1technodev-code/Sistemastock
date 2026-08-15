import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as userService from "../services/user.service";
import { createUserSchema, resetPasswordSchema, updateUserSchema } from "../schemas/user.schema";

export const list = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.listUsers(req.user?.localId, req.query as Record<string, string>);
  res.json(result);
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const input = createUserSchema.parse(req.body);
  const user = await userService.createUser(req.user?.localId, input, req.user?.role);
  res.status(201).json({ user });
});

export const update = catchAsync(async (req: Request, res: Response) => {
  const input = updateUserSchema.parse(req.body);
  const user = await userService.updateUser(req.user?.localId, req.params.id, input, req.user!.id, req.user?.role);
  res.json({ user });
});


export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const input = resetPasswordSchema.parse(req.body ?? {});
  const result = await userService.resetUserPassword(req.user?.localId, req.params.id, input.newPassword, req.user?.role);
  res.json(result);
});
