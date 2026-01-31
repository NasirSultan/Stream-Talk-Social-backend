import { Types } from "mongoose"

export interface ITicketPurchase {
  user: Types.ObjectId
  ticketType: string
  quantity: number
  token: string
  purchasedAt: Date
}
