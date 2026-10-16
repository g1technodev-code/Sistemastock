import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  // Clave por la que se agrupan los intentos (por defecto, la IP del cliente)
  keyGenerator?: (req: Request) => string;
  // Si es true, solo cuentan las respuestas fallidas (status >= 400) y una
  // respuesta exitosa resetea el contador de esa clave
  skipSuccessfulRequests?: boolean;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

const ipKey = (req: Request) => req.ip || req.socket.remoteAddress || "unknown";

export function createRateLimiter(options: RateLimitOptions) {
  const hits = new Map<string, ClientRecord>();
  const keyGenerator = options.keyGenerator ?? ipKey;

  // Limpieza periódica de clientes cuya ventana ya expiró
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, 60_000);
  if (cleanupTimer.unref) cleanupTimer.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = hits.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + options.windowMs };
      hits.set(key, record);
    }

    if (record.count >= options.max) {
      return next(
        ApiError.tooManyRequests(
          options.message || "Demasiados intentos. Por favor reintente más tarde."
        )
      );
    }

    record.count += 1;
    // Al alcanzar el máximo, el bloqueo dura windowMs completos desde este intento
    if (record.count === options.max) {
      record.resetTime = now + options.windowMs;
    }

    if (options.skipSuccessfulRequests) {
      res.on("finish", () => {
        if (res.statusCode < 400) hits.delete(key);
      });
    }

    next();
  };
}
