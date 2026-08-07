import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { getMetrics, listLocales, createLocal, updateStatus } from "../controllers/superadmin.controller";

const router = Router();

router.use(authenticate, authorize("SUPERADMIN"));

router.get("/metrics", getMetrics);
router.get("/locales", listLocales);
router.post("/locales", createLocal);
router.patch("/locales/:id/status", updateStatus);

export default router;

