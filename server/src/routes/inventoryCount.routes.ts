import { Router } from "express";
import * as inventoryCountController from "../controllers/inventoryCount.controller";
import { authenticate, requireFeature } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate, requireFeature("PHYSICAL_INVENTORY"));

router.post("/", inventoryCountController.createSession);
router.get("/", inventoryCountController.listSessions);
router.get("/:id", inventoryCountController.getSession);
router.put("/:id/items", inventoryCountController.upsertItem);
router.delete("/:id/items/:productId", inventoryCountController.removeItem);
router.post("/:id/confirm", inventoryCountController.confirmSession);

export default router;
