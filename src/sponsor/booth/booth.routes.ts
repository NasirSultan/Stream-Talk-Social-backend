import { Router } from "express"
import { authenticate } from "../../middlewares/auth.middleware"
import {
  createBooth,
  getMyBoothByEvent,
  getEventBooths,
  getSponsorBooths
} from "./booth.controller"

const router = Router()

router.post("/:eventId", authenticate, createBooth)
router.get("/event/:eventId", getEventBooths)
router.get("/me/:eventId", authenticate, getMyBoothByEvent)
router.get("/me", authenticate, getSponsorBooths)
export default router
