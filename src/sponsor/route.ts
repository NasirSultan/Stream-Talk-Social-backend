import { Router } from "express";
import profileRoutes from "./profile/profile.routes";

const router = Router();
router.use("/profile", profileRoutes);

export default router;
