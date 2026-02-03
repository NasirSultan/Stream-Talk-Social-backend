import { Types } from "mongoose"

export interface IBooth {
  sponsor: Types.ObjectId
  event: Types.ObjectId
  boothNumber: string
  boothLocation: string
  status?: "active" | "inactive"
  createdAt?: Date
  updatedAt?: Date
}
