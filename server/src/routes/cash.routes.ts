import { Router } from "express";
import * as cashController from "../controllers/cash.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/status", cashController.getStatus);
router.get("/summary", cashController.getSummary);
router.post("/shifts/open", cashController.openShift);
router.post("/shifts/:id/close", cashController.closeShift);
router.get("/shifts", cashController.listShifts);
router.post("/withdrawals", authorize("ADMIN"), cashController.createWithdrawal);
router.get("/withdrawals", authorize("ADMIN", "MANAGER"), cashController.listWithdrawals);
router.get("/movements", authorize("ADMIN", "MANAGER"), cashController.listMovements);

export default router;
