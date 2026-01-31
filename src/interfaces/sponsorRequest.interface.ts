import { Document, Types } from "mongoose"

export interface ISponsorRequest extends Document {
  sponsorId: Types.ObjectId
  category: "main" | "sub"
  status?: "pending" | "approved" | "rejected"
  createdAt?: Date
  updatedAt?: Date
}
