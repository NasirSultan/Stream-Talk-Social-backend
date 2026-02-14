import { Types } from "mongoose"
import { models } from "../models/model"
const { Event } = models
import { IEvent } from "../interfaces/event.interface"

import { eventEmitter } from "../rag/ragEvent/ragEvent.service";

export class EventService {
  async createEvent(data: IEvent) {
    const event = new Event(data);
    const savedEvent = await event.save();

    eventEmitter.emit("eventCreated", savedEvent);

    return savedEvent;
  }

async getAllEvents() {
    console.log("Database called to fetch events")
    return Event.find()
  }

  async getEventById(eventId: Types.ObjectId) {
    return Event.findById(eventId)
  }

  async updateEvent(eventId: Types.ObjectId, data: Partial<IEvent>) {
    return Event.findByIdAndUpdate(eventId, data, { new: true })
  }

async deleteEvent(eventId: Types.ObjectId) {
  const deletedEvent = await Event.findByIdAndDelete(eventId)

  if (!deletedEvent) {
    return { success: false, message: "Event not found" }
  }

  eventEmitter.emit("eventDeleted", deletedEvent._id.toString())

  return { success: true, message: "Event deleted successfully" }
}


async getEventsAvailability() {
    const events = await Event.find()

    return events.map(event => {
      const tickets = event.tickets || []
      const purchases = event.purchases || []

      const ticketStats = tickets.map(t => {
        const sold = purchases
          .filter(p => p.ticketType === t.type)
          .reduce((acc, p) => acc + p.quantity, 0)

        return {
          type: t.type,
          total: t.quantity + sold,
          remaining: t.quantity
        }
      })

      const totalTickets = ticketStats.reduce((a, t) => a + t.total, 0)
      const remainingTickets = ticketStats.reduce((a, t) => a + t.remaining, 0)

      return {
        eventId: event._id,
        title: event.title,
        type: event.type,
        startTime: event.startTime,
        endTime: event.endTime,
        tickets: ticketStats,
        totalTickets,
        remainingTickets
      }
    })
  }


  async getUpcomingEvents() {
    const now = new Date()

    return Event.find({
      startTime: { $gt: now }
    })
     .populate({
  path: "createdBy",
  strictPopulate: false
})

      .sort({ startTime: 1 })
  }


}
