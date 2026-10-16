import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  getMetrics,
  listLocales,
  createLocal,
  updateStatus,
  updatePlan,
  removeLocal,
  listUsers,
  updateUserStatus,
  resetUserPassword,
  revokeUserSessions,
  createAnnouncement,
  listAnnouncements,
  removeAnnouncement,
  listPayments,
  createManualPayment,
} from "../controllers/superadmin.controller";

import * as planController from "../controllers/plan.controller";
import * as catalogProductController from "../controllers/catalogProduct.controller";
import { uploadExcel } from "../middlewares/upload.middleware";

const router = Router();

router.use(authenticate, authorize("SUPERADMIN"));

router.get("/metrics", getMetrics);
router.get("/locales", listLocales);
router.post("/locales", createLocal);
router.patch("/locales/:id/status", updateStatus);
router.patch("/locales/:id/plan", updatePlan);
router.delete("/locales/:id", removeLocal);

router.get("/users", listUsers);
router.patch("/users/:id/status", updateUserStatus);
router.post("/users/:id/reset-password", resetUserPassword);
router.post("/users/:id/revoke-sessions", revokeUserSessions);

router.get("/plans", planController.list);
router.post("/plans", planController.create);
router.patch("/plans/:id", planController.update);
router.delete("/plans/:id", planController.remove);

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




