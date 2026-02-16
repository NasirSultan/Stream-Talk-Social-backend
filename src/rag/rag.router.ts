import { Router } from "express"
import ragEventRoutes from "./ragEvent/ragEvent.routes"
import postRagRoutes from "./postRag/postRag.router"
import superAgentRouter from "./SuperAgent/superAgent.router";
const router = Router()

router.use("/events", ragEventRoutes)
router.use("/posts", postRagRoutes)
router.use("/super-agent", superAgentRouter);
export default router
