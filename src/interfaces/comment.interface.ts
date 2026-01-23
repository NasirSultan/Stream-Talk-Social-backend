import { Types } from "mongoose"

export interface Comment {
  _id?: Types.ObjectId
  content: string
  post: Types.ObjectId
  author: Types.ObjectId
  parentComment?: Types.ObjectId | null
  createdAt?: Date
  updatedAt?: Date
}
