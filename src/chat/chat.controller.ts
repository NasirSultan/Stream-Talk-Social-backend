import { Request, Response } from "express"
import { ChatService } from "./chat.service"

export const createConversation = async (req: Request, res: Response) => {
  try {
    const userIds: string[] = req.body.userIds
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) 
      return res.status(400).json({ message: "Invalid users" })

    const currentUserId = req.user.id
    if (!userIds.includes(currentUserId)) userIds.push(currentUserId)

    const conversation = await ChatService.createConversation(userIds)
    res.json(conversation)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { conversationId, content, attachments } = req.body
    const senderId = req.user.id
    const message = await ChatService.sendMessage(conversationId, senderId, content, attachments)
    res.json(message)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params
    const messages = await ChatService.getMessages(conversationId, req.user.id)
    res.json(messages)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params
    const message = await ChatService.deleteMessage(messageId, req.user.id)
    res.json({ message: "Deleted for you", data: message })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

export const markMessagesRead = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params
    await ChatService.markAsRead(conversationId, req.user.id)
    res.json({ message: "Messages marked as read" })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

export const deleteConversation = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params
    const conversation = await ChatService.deleteConversationForUser(conversationId, req.user.id)
    res.json({ message: "Conversation deleted for you", data: conversation })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}
