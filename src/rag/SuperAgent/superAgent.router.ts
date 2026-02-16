import { Router } from "express";
import { SuperAgentController } from "./superAgent.controller";

const router = Router();
const superAgentController = new SuperAgentController();

/**
 * POST /api/rag/super-agent/query
 * Body: { query: string }
 * 
 * Example requests:
 * - { "query": "Find upcoming tech conferences" }  -> calls event_rag
 * - { "query": "Show me blog posts about AI" }     -> calls post_rag
 */
router.post("/query", (req, res) => superAgentController.query(req, res));

export default router;