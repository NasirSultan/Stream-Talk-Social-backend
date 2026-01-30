import { Router } from "express";
import profileRoutes from "./profile/profile.routes";
import representativeRoutes from "./representative/representative.routes"
import productRoutes from "./product/product.routes"

const router = Router();
router.use("/profile", profileRoutes);
router.use("/representatives", representativeRoutes);
router.use("/products", productRoutes)
export default router;
