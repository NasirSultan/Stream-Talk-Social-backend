import { Document, Types } from "mongoose"
import { IRepresentative } from "./representative.interface"

export interface ISponsor extends Document {
  user: Types.ObjectId
  companyName: string
  logo?: string
  website?: string
  category?: string
  description?: string
  verified?: boolean
  representatives?: IRepresentative[]
  createdAt?: Date
  updatedAt?: Date
}
