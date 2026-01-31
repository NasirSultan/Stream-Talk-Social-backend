import { Router } from "express"
import { buyTicket } from "./ticketPurchase.controller"
import { authenticate } from "../../middlewares/auth.middleware"

const router = Router({ mergeParams: true })

router.post("/", authenticate, buyTicket)

export default router
