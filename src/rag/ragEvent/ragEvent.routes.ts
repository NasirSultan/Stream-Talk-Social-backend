import { Router } from "express";
import { RagEventController } from "./ragEvent.controller";

const router = Router();
const controller = new RagEventController();

router.post("/add", controller.addEvent.bind(controller));
router.post("/query", controller.queryEvent.bind(controller));

export default router;
