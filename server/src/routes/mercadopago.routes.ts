import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { createCheckout } from "../controllers/mercadopago.controller";

const router = Router();

router.use(authenticate);
router.post("/checkout", createCheckout);

export default router;
