import { Router } from "express"
import {
  createRequest,
  getRequests,
  updateStatus,
  deleteRequest
} from "./sponsorRequest.controller"
import { authenticate, authorizeOrganizer } from "../../middlewares/auth.middleware"

const router = Router({ mergeParams: true })

router.post("/", authenticate, createRequest)      
router.delete("/:requestId", authenticate, createRequest) 

router.get("/", authenticate, authorizeOrganizer, getRequests) 
router.put("/:requestId", authenticate, authorizeOrganizer, updateStatus)


export default router
