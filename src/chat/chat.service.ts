import { models } from "../models/model"
import { Types } from "mongoose"
import { IConversation } from "../interfaces/IConversation.interface"
import { IMessage } from "../interfaces/chat.interface"

const { Conversation, Message } = models

export class ChatService {
  
  static async createConversation(userIds: string[]): Promise<IConversation> {
    const objectIds = userIds.map(id => new Types.ObjectId(id))

    let conversation = await Conversation.findOne({
      participants: { $all: objectIds, $size: objectIds.length }
    })

    if (conversation) {
      const deletedFor = conversation.deletedFor || []
      const userIdsSet = new Set(objectIds.map(id => id.toString()))
      const anyDeleted = deletedFor.some(id => userIdsSet.has(id.toString()))
      if (anyDeleted) conversation = null
    }

    if (!conversation) {
      conversation = await Conversation.create({ participants: objectIds, deletedFor: [] })
    }

    return conversation
  }

  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    attachments?: string[]
  ): Promise<IMessage> {
    const conversation = await Conversation.findById(conversationId)
    if (!conversation) throw new Error("Conversation not found")

    const message = await Message.create({
      conversationId: new Types.ObjectId(conversationId),
      sender: new Types.ObjectId(senderId),
      content,
      attachments: attachments || [],
      readBy: [new Types.ObjectId(senderId)],
      deletedFor: []
    })

    conversation.lastMessage = {
      content,
      sender: new Types.ObjectId(senderId),
      createdAt: new Date()
    }

    await conversation.save()
    return message
  }

  static async getMessages(conversationId: string, userId: string) {
    return Message.find({
      conversationId: new Types.ObjectId(conversationId),
      deletedFor: { $ne: new Types.ObjectId(userId) }
    }).sort({ createdAt: 1 })
  }

  static async deleteMessage(messageId: string, userId: string) {
    const message = await Message.findById(messageId)
    if (!message) throw new Error("Message not found")

    const userObjectId = new Types.ObjectId(userId)
    if (!message.deletedFor.includes(userObjectId)) {
      message.deletedFor.push(userObjectId)
      await message.save()
    }

    return message
  }

  static async markAsRead(conversationId: string, userId: string) {
    await Message.updateMany(
      { conversationId: new Types.ObjectId(conversationId), readBy: { $ne: new Types.ObjectId(userId) } },
      { $push: { readBy: new Types.ObjectId(userId) } }
    )
  }

  static async deleteConversationForUser(conversationId: string, userId: string) {
    const conversation = await Conversation.findById(conversationId)
    if (!conversation) throw new Error("Conversation not found")

    const userObjectId = new Types.ObjectId(userId)
    if (!conversation.deletedFor.includes(userObjectId)) {
      conversation.deletedFor.push(userObjectId)
      await conversation.save()
    }

    return conversation
  }
}
