import { Router } from "express";
import * as supplierController from "../controllers/supplier.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", supplierController.list);
router.post("/", authorize("ADMIN", "MANAGER"), supplierController.create);
router.patch("/:id", authorize("ADMIN", "MANAGER"), supplierController.update);
router.delete("/:id", authorize("ADMIN", "MANAGER"), supplierController.remove);

router.get("/:id/account", supplierController.getAccount);
router.get("/:id/movements", supplierController.listMovements);
router.post("/:id/payments", authorize("ADMIN", "MANAGER"), supplierController.registerPayment);

export default router;
