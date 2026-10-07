import { Router } from "express";
import * as poController from "../controllers/purchaseOrder.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", poController.list);
router.get("/:id", poController.get);
router.post("/", authorize("ADMIN", "MANAGER"), poController.create);
router.patch("/:id", authorize("ADMIN", "MANAGER"), poController.update);
router.post("/:id/receive", authorize("ADMIN", "MANAGER"), poController.receive);

export default router;
