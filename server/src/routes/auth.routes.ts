import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { createRateLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();

const loginLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: "Demasiados intentos fallidos para este email. Por favor espera 5 minutos.",
  // El bloqueo aplica solo al email que se esta probando, no a toda la IP
  keyGenerator: (req) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    return email ? `email:${email}` : `ip:${req.ip}`;
  },
  skipSuccessfulRequests: true,
});

const refreshLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
});

router.post("/login", loginLimiter, authController.login);
router.post("/refresh", refreshLimiter, authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);

export default router;
