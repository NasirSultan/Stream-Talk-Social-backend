import { Router } from "express"
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getUpcomingEvents 
} from "./event.controller"
import { getEventsAvailability } from "./event.controller"
import sponsorRequestRoutes from "./sponsorRequest/sponsorRequest.routes"
import ticketPurchaseRoutes from "./ticketPurchase/ticketPurchase.routes"
import { authenticate, authorizeOrganizer } from "../middlewares/auth.middleware"

const router = Router()

router.use(authenticate)

router.post("/", authorizeOrganizer, createEvent)
router.get("/", getAllEvents)
router.get("/availability", getEventsAvailability)
router.get("/upcoming", getUpcomingEvents)
router.get("/:eventId", getEventById)


router.put("/:eventId", authorizeOrganizer, updateEvent)
router.delete("/:eventId", authorizeOrganizer, deleteEvent)


router.use("/:eventId/sponsor-requests", sponsorRequestRoutes)
router.use("/:eventId/buy-ticket", ticketPurchaseRoutes)

export default router
