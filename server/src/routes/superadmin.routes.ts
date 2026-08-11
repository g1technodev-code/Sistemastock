import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  getMetrics,
  listLocales,
  createLocal,
  updateStatus,
  updatePlan,
  removeLocal,
  createAnnouncement,
  listAnnouncements,
  removeAnnouncement,
} from "../controllers/superadmin.controller";
import * as planController from "../controllers/plan.controller";

const router = Router();

router.use(authenticate, authorize("SUPERADMIN"));

router.get("/metrics", getMetrics);
router.get("/locales", listLocales);
router.post("/locales", createLocal);
router.patch("/locales/:id/status", updateStatus);
router.patch("/locales/:id/plan", updatePlan);
router.delete("/locales/:id", removeLocal);

router.get("/plans", planController.list);
router.post("/plans", planController.create);
router.patch("/plans/:id", planController.update);
router.delete("/plans/:id", planController.remove);

router.get("/announcements", listAnnouncements);
router.post("/announcements", createAnnouncement);
router.delete("/announcements/:id", removeAnnouncement);


export default router;


