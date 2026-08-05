import { Router } from "express";
import * as customerController from "../controllers/customer.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", customerController.list);
router.get("/:id", customerController.getOne);
router.post("/", customerController.create);
router.patch("/:id", customerController.update);
router.post("/:id/payments", customerController.registerPayment);

export default router;
