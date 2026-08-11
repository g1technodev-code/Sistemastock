import { Router } from "express";
import * as purchaseController from "../controllers/purchase.controller";
import { authenticate, authorize, requireFeature } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate, requireFeature("PURCHASES"));

router.get("/", purchaseController.listPurchases);
router.get("/:id", purchaseController.getPurchase);
router.post("/", authorize("ADMIN", "MANAGER", "EMPLOYEE"), purchaseController.createPurchase);
router.patch("/:id", authorize("ADMIN", "MANAGER"), purchaseController.updatePurchase);
router.post("/:id/receive", authorize("ADMIN", "MANAGER", "EMPLOYEE"), purchaseController.receivePurchase);
router.post("/:id/cancel", authorize("ADMIN", "MANAGER"), purchaseController.cancelPurchase);

export default router;
