import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", productController.list);
router.get("/barcode-lookup", productController.lookupBarcode);
router.get("/:id", productController.getOne);
router.post("/", authorize("ADMIN", "MANAGER"), productController.create);
router.patch("/:id", authorize("ADMIN", "MANAGER"), productController.update);
router.delete("/:id", authorize("ADMIN", "MANAGER"), productController.remove);

export default router;

