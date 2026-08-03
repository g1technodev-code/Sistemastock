import { Router } from "express";
import * as stockController from "../controllers/stock.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.post("/movements", stockController.createMovement);
router.get("/movements", stockController.listMovements);

export default router;
