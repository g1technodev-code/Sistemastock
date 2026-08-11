import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
import { verifyAccessToken } from "../utils/jwt";
import { ApiError } from "../utils/apiError";
import type { PlanFeature } from "../constants/planFeatures";

export type AuthUser = {
  id: string;
  localId?: string | null;
  email: string;
  role: Role;
  planFeatures?: string[];
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Falta el token de acceso"));
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, localId: payload.localId, email: payload.email, role: payload.role, planFeatures: payload.planFeatures };
    next();
  } catch {
    next(ApiError.unauthorized("Token de acceso inválido o expirado"));
  }
}


export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(ApiError.forbidden());
    }
    next();
  };
}

export function requireFeature(feature: PlanFeature) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.role === "SUPERADMIN") return next();
    if (!req.user.planFeatures?.includes(feature)) {
      return next(ApiError.forbidden("Tu plan actual no incluye este módulo. Actualiza tu plan para acceder."));
    }
    next();
  };
}
