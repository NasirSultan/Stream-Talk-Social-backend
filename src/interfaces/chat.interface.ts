import mongoose, { Schema, Document, Types } from "mongoose"

export interface IMessage extends Document {
  conversationId: Types.ObjectId
  sender: Types.ObjectId
  content: string
  readBy: Types.ObjectId[]
  deletedFor: Types.ObjectId[]
  attachments?: string[]
  createdAt?: Date
  updatedAt?: Date
}