import { Document, Types } from "mongoose"
import { IRepresentative } from "./representative.interface"
import { IProduct } from "./product.interface"
export interface ISponsor extends Document {
  user: Types.ObjectId
  companyName: string
  logo?: string
  website?: string
  category?: string
  description?: string
  verified?: boolean
  representatives?: IRepresentative[]
    products?: IProduct[]
  createdAt?: Date
  updatedAt?: Date
}
