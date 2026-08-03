import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import categoryRoutes from "./category.routes";
import supplierRoutes from "./supplier.routes";
import productRoutes from "./product.routes";
import stockRoutes from "./stock.routes";
import saleRoutes from "./sale.routes";
import cashRoutes from "./cash.routes";
import dashboardRoutes from "./dashboard.routes";
import reportRoutes from "./report.routes";
import searchRoutes from "./search.routes";
import settingsRoutes from "./settings.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/products", productRoutes);
router.use("/stock", stockRoutes);
router.use("/sales", saleRoutes);
router.use("/cash", cashRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);
router.use("/search", searchRoutes);
router.use("/settings", settingsRoutes);

export default router;
