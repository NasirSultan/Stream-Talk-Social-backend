import { Types } from "mongoose"

export interface IRepresentative {
  _id?: Types.ObjectId
  name: string
  role?: string
  email?: string
  phone?: string
  linkedIn?: string
}
