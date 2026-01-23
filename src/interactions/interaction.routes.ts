import { Router } from "express";
import * as interactionController from "./interaction.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post("/react", authenticate, interactionController.react);
router.post("/bookmark/:postId", authenticate, interactionController.bookmark);
router.post("/share/:postId", authenticate, interactionController.share);
router.get("/counts/:targetType/:targetId", interactionController.getCounts);

export default router;
