import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import { comparePassword } from "../utils/password";
import {
  generateRefreshTokenValue,
  hashRefreshToken,
  refreshTokenExpiryDate,
  signAccessToken,
} from "../utils/jwt";
import type { AuthUser } from "../middlewares/auth.middleware";

async function issueTokenPair(user: {
  id: string;
  localId?: string | null;
  email: string;
  role: AuthUser["role"];
  planFeatures?: string[];
}) {
  const accessToken = signAccessToken({
    sub: user.id,
    localId: user.localId,
    email: user.email,
    role: user.role,
    planFeatures: user.planFeatures,
  });

  const refreshTokenValue = generateRefreshTokenValue();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshTokenValue),
      expiresAt: refreshTokenExpiryDate(),
    },
  });

  return { accessToken, refreshToken: refreshTokenValue };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email }, include: { local: { include: { plan: true } } } });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Credenciales inválidas");
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized("Credenciales inválidas");
  }

  if (user.local?.status === "SUSPENDED") {
    throw ApiError.forbidden("Tu cuenta está suspendida. Contactá al administrador.");
  }

  const planFeatures = user.local?.plan.enabledFeatures ?? [];
  const tokens = await issueTokenPair({ ...user, planFeatures });
  return {
    ...tokens,
    user: {
      id: user.id,
      localId: user.localId,
      name: user.name,
      email: user.email,
      role: user.role,
      canCreateProducts: user.canCreateProducts,
      planFeatures,
    },
  };
}

export async function refresh(refreshTokenValue: string) {
  const tokenHash = hashRefreshToken(refreshTokenValue);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { include: { local: { include: { plan: true } } } } },
  });

  if (!stored) {
    throw ApiError.unauthorized("Sesión inválida, inicia sesión nuevamente");
  }

  if (stored.revokedAt || stored.expiresAt < new Date()) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw ApiError.unauthorized("Sesión expirada o revocada, inicia sesión nuevamente");
  }

  if (!stored.user.isActive) {
    throw ApiError.forbidden("Tu cuenta ha sido desactivada");
  }

  if (stored.user.local?.status === "SUSPENDED") {
    throw ApiError.forbidden("Tu cuenta está suspendida. Contactá al administrador.");
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const planFeatures = stored.user.local?.plan.enabledFeatures ?? [];
  const tokens = await issueTokenPair({ ...stored.user, planFeatures });
  return {
    ...tokens,
    user: {
      id: stored.user.id,
      localId: stored.user.localId,
      name: stored.user.name,
      email: stored.user.email,
      role: stored.user.role,
      canCreateProducts: stored.user.canCreateProducts,
      planFeatures,
    },
  };
}

export async function logout(refreshTokenValue: string | undefined) {
  if (!refreshTokenValue) return;
  const tokenHash = hashRefreshToken(refreshTokenValue);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSessionsForUser(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { local: { include: { plan: true } } } });
  if (!user) throw ApiError.notFound("Usuario no encontrado");
  return {
    id: user.id,
    localId: user.localId,
    name: user.name,
    email: user.email,
    role: user.role,
    canCreateProducts: user.canCreateProducts,
    planFeatures: user.local?.plan.enabledFeatures ?? [],
  };
}


