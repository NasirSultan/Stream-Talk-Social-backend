import { Router } from "express"
import { authenticate } from "../middlewares/auth.middleware"
import { 
  createConversation, 
  sendMessage, 
  getMessages, 
  deleteMessage, 
  markMessagesRead, 
  deleteConversation 
} from "./chat.controller"

const router = Router()

router.post("/conversation", authenticate, createConversation)
router.post("/message", authenticate, sendMessage)
router.get("/messages/:conversationId", authenticate, getMessages)
router.delete("/message/:messageId", authenticate, deleteMessage)
router.patch("/messages/read/:conversationId", authenticate, markMessagesRead)
router.delete("/conversation/:conversationId", authenticate, deleteConversation)

export default router
