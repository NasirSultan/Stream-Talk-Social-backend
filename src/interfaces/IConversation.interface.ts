import mongoose, { Schema } from "mongoose"
export interface IConversation {
  participants: mongoose.Types.ObjectId[]
  lastMessage?: {
    content: string
    sender: mongoose.Types.ObjectId
    createdAt: Date
  }
  deletedFor: mongoose.Types.ObjectId[]
  updatedAt?: Date
}