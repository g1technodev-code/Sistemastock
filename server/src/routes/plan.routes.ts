import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as planController from "../controllers/plan.controller";

const router = Router();

router.use(authenticate);
router.get("/", planController.listPublic);

export default router;
