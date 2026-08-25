import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  getMetrics,
  listLocales,
  createLocal,
  updateStatus,
  updatePlan,
  updateRubro,
  removeLocal,
  createAnnouncement,
  listAnnouncements,
  removeAnnouncement,
  listPayments,
  createManualPayment,
} from "../controllers/superadmin.controller";

import * as planController from "../controllers/plan.controller";
import * as rubroController from "../controllers/rubro.controller";
import * as catalogProductController from "../controllers/catalogProduct.controller";
import { uploadExcel } from "../middlewares/upload.middleware";

const router = Router();

router.use(authenticate, authorize("SUPERADMIN"));

router.get("/metrics", getMetrics);
router.get("/locales", listLocales);
router.post("/locales", createLocal);
router.patch("/locales/:id/status", updateStatus);
router.patch("/locales/:id/plan", updatePlan);
router.patch("/locales/:id/rubro", updateRubro);
router.delete("/locales/:id", removeLocal);

router.get("/plans", planController.list);
router.post("/plans", planController.create);
router.patch("/plans/:id", planController.update);
router.delete("/plans/:id", planController.remove);

router.get("/rubros", rubroController.list);
router.post("/rubros", rubroController.create);
router.patch("/rubros/:id", rubroController.update);
router.delete("/rubros/:id", rubroController.remove);

router.get("/catalog-products", catalogProductController.list);
router.post("/catalog-products", catalogProductController.create);
router.get("/catalog-products/bulk/template", catalogProductController.downloadTemplate);
router.post("/catalog-products/bulk", uploadExcel, catalogProductController.bulkCreate);
router.patch("/catalog-products/:id", catalogProductController.update);
router.delete("/catalog-products/:id", catalogProductController.remove);

router.get("/announcements", listAnnouncements);
router.post("/announcements", createAnnouncement);
router.delete("/announcements/:id", removeAnnouncement);

router.get("/payments", listPayments);
router.post("/payments/manual", createManualPayment);

export default router;




