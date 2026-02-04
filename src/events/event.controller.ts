import { Request, Response } from "express"
import { EventService } from "./event.service"
import { Types } from "mongoose"

const service = new EventService()

export const createEvent = async (req: Request, res: Response) => {
  const eventData = { ...req.body, sponsorId: req.user?.id }
  const event = await service.createEvent(eventData)
  res.status(201).json(event)
}

export const getAllEvents = async (req: Request, res: Response) => {
  const events = await service.getAllEvents()
  res.status(200).json(events)
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
  res.status(200).json({ message: "Event deleted successfully" })
}


