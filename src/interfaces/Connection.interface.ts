import { Document, Types } from "mongoose"

export interface Connection extends Document {
  requester: Types.ObjectId
  recipient: Types.ObjectId
  status: "pending" | "accepted" | "rejected"
  createdAt: Date
  updatedAt: Date
}
