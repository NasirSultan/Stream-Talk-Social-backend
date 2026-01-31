import { Types } from "mongoose"
import { models } from "../models/model"
const { Event } = models
import { IEvent } from "../interfaces/event.interface"



export class EventService {
  async createEvent(data: IEvent) {
    const event = new Event(data)
    return event.save()
  }

  async getAllEvents() {
    return Event.find()
  }

  async getEventById(eventId: Types.ObjectId) {
    return Event.findById(eventId)
  }

  async updateEvent(eventId: Types.ObjectId, data: Partial<IEvent>) {
    return Event.findByIdAndUpdate(eventId, data, { new: true })
  }

  async deleteEvent(eventId: Types.ObjectId) {
    return Event.findByIdAndDelete(eventId)
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

}
