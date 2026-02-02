import express from "express"
import { 
  createUser, 
  getUsers, 
  sendConnectionRequest, 
  respondConnectionRequest, 
  getConnections, 
  getAcceptedConnections ,
   suggestFriends
} from "./user.controller"
import { authenticate } from "../middlewares/auth.middleware"

const router = express.Router()

router.post("/", createUser)
router.get("/", getUsers)

// Routes protected by authentication
router.post("/connect", authenticate, sendConnectionRequest)
router.patch("/request/:requestId/respond", authenticate, respondConnectionRequest)
router.get("/connections", authenticate, getConnections)
router.get("/connections-accepted", authenticate, getAcceptedConnections)
router.get("/suggest-friends", authenticate, suggestFriends)

export default router
