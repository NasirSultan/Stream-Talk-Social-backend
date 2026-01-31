import { models } from "../../models/model"
import { Types } from "mongoose"
import crypto from "crypto"

const { Event, User } = models

export class TicketPurchaseService {
  async buyTicket(eventId: Types.ObjectId, userId: Types.ObjectId, ticketType: string) {
    const event = await Event.findById(eventId)
    if (!event) throw new Error("Event not found")

    const ticket = event.tickets?.find(t => t.type === ticketType)
    if (!ticket) throw new Error("Ticket type not found")

    const alreadyPurchased = event.purchases?.some(p => p.user.toString() === userId.toString())
    if (alreadyPurchased) throw new Error("You have already purchased a ticket for this event")

    if (ticket.quantity < 1) throw new Error("Not enough tickets")

    ticket.quantity -= 1

    const token = crypto.randomBytes(4).toString("hex")

    const purchase = {
      user: userId,
      ticketType,
      quantity: 1,
      token,
      purchasedAt: new Date()
    }

    event.purchases?.push(purchase)
    await event.save()

    const buyer = await User.findById(userId)

    return {
      status: "success",
      message: "Ticket purchased successfully",
      data: {
        ticket: {
          id: purchase.user,
          token,
          typeId: ticket._id,
          typeName: ticket.type,
          price: ticket.price,
          createdAt: purchase.purchasedAt
        },
        buyer: {
          id: buyer?._id,
          name: buyer?.name,
          email: buyer?.email
        },
        event: {
          id: event._id,
          title: event.title,
          date: event.startTime,
          location: event.location
        },
        rule: {
          oneUserOneTicket: true
        }
      }
    }
  }
}
