import { Router } from "express";
import * as searchController from "../controllers/search.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authenticate, searchController.search);

export default router;
