import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { env } from "../config/env";
import * as authService from "../services/auth.service";
import { loginSchema } from "../schemas/auth.schema";

const REFRESH_COOKIE = "sf_refresh";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: env.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
}

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const { accessToken, refreshToken, user } = await authService.login(email, password);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const incoming = req.cookies?.[REFRESH_COOKIE];
  if (!incoming) {
    return res.status(401).json({ message: "No hay sesión activa" });
  }
  const { accessToken, refreshToken, user } = await authService.refresh(incoming);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const incoming = req.cookies?.[REFRESH_COOKIE];
  await authService.logout(incoming);
  clearRefreshCookie(res);
  res.status(204).send();
});

export const me = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  res.json({ user });
});
