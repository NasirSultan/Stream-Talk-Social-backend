import { Request, Response } from "express"
import { TicketPurchaseService } from "./ticketPurchase.service"
import { Types } from "mongoose"

const service = new TicketPurchaseService()

export const buyTicket = async (req: Request, res: Response) => {
  try {
    const eventId = new Types.ObjectId(req.params.eventId)
    const userId = new Types.ObjectId(req.user.id)
    const { ticketType } = req.body

    const result = await service.buyTicket(eventId, userId, ticketType)
    res.status(201).json(result)
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}
