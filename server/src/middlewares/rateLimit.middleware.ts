import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: RateLimitOptions) {
  const hits = new Map<string, ClientRecord>();

  // Limpieza periódica de clientes cuya ventana ya expiró
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(ip);
      }
    }
  }, 60_000);
  if (cleanupTimer.unref) cleanupTimer.unref();

  return (req: Request, _res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    const record = hits.get(ip);
    if (!record || now > record.resetTime) {
      hits.set(ip, { count: 1, resetTime: now + options.windowMs });
      return next();
    }

    record.count += 1;
    if (record.count > options.max) {
      return next(
        ApiError.tooManyRequests(
          options.message || "Demasiados intentos desde esta IP. Por favor reintente más tarde."
        )
      );
    }

    next();
  };
}
