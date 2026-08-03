import { Router } from "express";
import * as settingsController from "../controllers/settings.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", settingsController.getSettings);
router.put("/", authorize("ADMIN"), settingsController.updateSettings);

export default router;
