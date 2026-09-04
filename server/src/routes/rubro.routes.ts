import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as rubroController from "../controllers/rubro.controller";

const router = Router();

router.use(authenticate);
router.get("/", rubroController.listPublic);

export default router;
