import { Router } from "express";
import profileRoutes from "./profile/profile.routes";
import representativeRoutes from "./representative/representative.routes"
import productRoutes from "./product/product.routes"
import boothRoutes from "./booth/booth.routes"
const router = Router();
router.use("/profile", profileRoutes);
router.use("/representatives", representativeRoutes);
router.use("/products", productRoutes)
router.use("/booths", boothRoutes)
export default router;
