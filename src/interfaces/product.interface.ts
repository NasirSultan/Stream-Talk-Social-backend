import { Types } from "mongoose"

export interface IProduct {
  _id?: Types.ObjectId
  name: string
  description: string
  media?: string
  link?: string
  category?: string
}
