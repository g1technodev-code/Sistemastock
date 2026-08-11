import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getLatestAnnouncement } from "../controllers/superadmin.controller";

const router = Router();

router.use(authenticate);
router.get("/latest", getLatestAnnouncement);

export default router;
