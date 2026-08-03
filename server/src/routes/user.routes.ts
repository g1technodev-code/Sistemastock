import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/", userController.list);
router.post("/", userController.create);
router.patch("/:id", userController.update);
router.patch("/:id/reset-password", userController.resetPassword);

export default router;
