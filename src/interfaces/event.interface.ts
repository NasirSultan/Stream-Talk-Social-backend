import { Document, Types } from "mongoose"
import { ISponsorRequest } from "./sponsorRequest.interface"
import { ITicketPurchase } from "./ticketPurchase.interface"

export interface ITicket {
  _id?: Types.ObjectId
  type: string
  price: number
  quantity: number
}

export interface IEvent extends Document {
  title: string
  description: string
  mapLink?: string
  location?: string
  type: "hybrid" | "online"
  token?: string
  startTime: Date
  endTime: Date
  publishForRegistration?: boolean
  tickets?: ITicket[]
    sponsorRequests?: ISponsorRequest[] 
      purchases?: ITicketPurchase[]
  totalCapacity?: number
  reservedTickets?: number
  sponsorId?: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}
