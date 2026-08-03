import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", categoryController.list);
router.post("/", authorize("ADMIN", "MANAGER"), categoryController.create);
router.patch("/:id", authorize("ADMIN", "MANAGER"), categoryController.update);
router.delete("/:id", authorize("ADMIN", "MANAGER"), categoryController.remove);

export default router;
