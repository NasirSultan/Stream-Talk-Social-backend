import { Request, Response } from "express"
import { EventService } from "./event.service"
import { Types } from "mongoose"
import crypto from "crypto"
let cachedEvents: any = null
let cachedHash: string | null = null

const service = new EventService()

export const createEvent = async (req: Request, res: Response) => {
  const eventData = { ...req.body, sponsorId: req.user?.id }
  const event = await service.createEvent(eventData)
    cachedEvents = null
  cachedHash = null
  res.status(201).json(event)
}

export const getAllEvents = async (req: Request, res: Response) => {
  if (req.headers["if-none-match"] && req.headers["if-none-match"] === cachedHash) {
    console.log("ETag matched. Skipping database call.")
    res.status(304).end()
    return
  }

if (!cachedEvents) {
  cachedEvents = await service.getAllEvents()
  console.log("Database called to fetch events")
  const eventsString = JSON.stringify(cachedEvents)
  cachedHash = crypto.createHash("md5").update(eventsString).digest("hex")
} else {
  console.log("Serving events from cache")
}


  res.setHeader("ETag", cachedHash!)
  res.status(200).json(cachedEvents)
}
export const getEventsAvailability = async (req: Request, res: Response) => {
  try {
    const data = await service.getEventsAvailability()
    res.status(200).json(data)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}
export const getUpcomingEvents = async (req: Request, res: Response) => {
  try {
    const events = await service.getUpcomingEvents()
    res.json(events)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}
export const getEventById = async (req: Request, res: Response) => {
  const eventId = new Types.ObjectId(req.params.eventId)
  const event = await service.getEventById(eventId)
  if (!event) return res.status(404).json({ message: "Event not found" })
  res.status(200).json(event)
}

export const updateEvent = async (req: Request, res: Response) => {
  const eventId = new Types.ObjectId(req.params.eventId)
  const event = await service.updateEvent(eventId, req.body)
  if (!event) return res.status(404).json({ message: "Event not found" })
  res.status(200).json(event)
}

export const deleteEvent = async (req: Request, res: Response) => {
  const eventId = new Types.ObjectId(req.params.eventId)
  const event = await service.deleteEvent(eventId)
      cachedEvents = null
  cachedHash = null
  res.status(200).json({ message: "Event deleted successfully" })
}


