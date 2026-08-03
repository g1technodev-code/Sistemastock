import { Router } from "express";
import * as reportController from "../controllers/report.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate, authorize("ADMIN", "MANAGER"));

router.get("/stock-valuation", reportController.stockValuation);
router.get("/movements", reportController.movements);
router.get("/top-products", reportController.topProducts);
router.get("/category-breakdown", reportController.categoryBreakdown);
router.get("/sales-stats", reportController.salesStats);
router.get("/profitability", reportController.profitability);

export default router;
