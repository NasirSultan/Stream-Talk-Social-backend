import { Request, Response } from "express"
import * as userService from "./user.service"

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body)
    res.status(201).json(user)
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getUsers()
    res.json(users)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

export const sendConnectionRequest = async (req: Request, res: Response) => {
  try {
    const { recipientId } = req.body
    const data: any = { recipient: recipientId }

    data.requester = (req as any).user.id  // set requester from token

    const request = await userService.sendConnectionRequest(data.requester, data.recipient)
    res.status(201).json(request)
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}


export const respondConnectionRequest = async (req: Request, res: Response) => {
  try {
    const { action } = req.body
    const { requestId } = req.params
    const response = await userService.respondConnectionRequest(requestId, action)
    res.json(response)
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export const getConnections = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id 
    const connections = await userService.getConnections(userId)
    res.json(connections)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

export const getAcceptedConnections = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const connections = await userService.getAcceptedConnections(userId)
    res.json({ connections })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

export const suggestFriends = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const suggestions = await userService.suggestFriends(userId)
    res.json({ suggestions })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}

