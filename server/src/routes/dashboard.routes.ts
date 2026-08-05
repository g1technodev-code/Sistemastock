import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.get("/summary", authenticate, authorize("ADMIN", "MANAGER"), dashboardController.summary);

export default router;
