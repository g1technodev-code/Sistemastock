import { Router } from "express";
import * as productController from "../controllers/product.controller";
import * as localCatalogController from "../controllers/localCatalog.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { uploadExcel } from "../middlewares/upload.middleware";

const router = Router();

router.use(authenticate);

router.get("/", productController.list);
router.get("/barcode-lookup", productController.lookupBarcode);
router.get("/catalog", localCatalogController.browse);
router.post("/catalog/:id/import", authorize("ADMIN", "MANAGER"), localCatalogController.importOne);
router.get("/bulk/template", productController.downloadBulkTemplate);
router.post("/bulk", authorize("ADMIN", "MANAGER"), uploadExcel, productController.bulkCreate);
router.get("/:id", productController.getOne);
router.post("/", authorize("ADMIN", "MANAGER"), productController.create);
router.patch("/:id", authorize("ADMIN", "MANAGER"), productController.update);
router.delete("/:id", authorize("ADMIN", "MANAGER"), productController.remove);

export default router;

