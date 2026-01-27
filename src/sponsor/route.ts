import { Router } from "express";
import profileRoutes from "./profile/profile.routes";
import representativeRoutes from "./representative/representative.routes"


const router = Router();
router.use("/profile", profileRoutes);
router.use("/representatives", representativeRoutes);
export default router;
