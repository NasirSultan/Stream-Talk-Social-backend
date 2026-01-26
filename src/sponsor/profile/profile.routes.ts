import { Router } from "express";
import { createProfile, getProfile, updateProfile } from "./profile.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.post("/", createProfile);
router.get("/", getProfile);
router.put("/", updateProfile);

export default router;
