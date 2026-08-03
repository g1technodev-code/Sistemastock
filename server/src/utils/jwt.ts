import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";
import type { Role } from "@prisma/client";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: Role;
};

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: jwt.SignOptions = { expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions["expiresIn"] };
  return jwt.sign(payload, env.jwt.accessSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
}

export function generateRefreshTokenValue(): string {
  return crypto.randomBytes(48).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiryDate(): Date {
  const days = env.jwt.refreshExpiresInDays;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
