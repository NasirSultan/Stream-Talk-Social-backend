import { Types } from "mongoose"
import { models } from "../models/model"
const { User ,ConnectionModel} = models

interface IUser {
  _id: Types.ObjectId | string
  name: string
  email: string
  role: string
}

export const createUser = async (userData: any) => {
  const user = await User.create(userData)
  return user
}

export const getUsers = async () => {
  return await User.find()
}

export const sendConnectionRequest = async (requesterId: string, recipientId: string) => {
  if (requesterId === recipientId) throw new Error("Cannot connect with yourself")
  const recipient = await User.findById(recipientId)
  if (!recipient) throw new Error("Recipient user does not exist")
  const existing = await ConnectionModel.findOne({ requester: requesterId, recipient: recipientId })
  if (existing) throw new Error("Connection request already exists")
  const request = await ConnectionModel.create({ requester: requesterId, recipient: recipientId })
  return request
}

export const respondConnectionRequest = async (requestId: string, action: "accepted" | "rejected") => {
  const request = await ConnectionModel.findById(requestId)
  if (!request) throw new Error("Connection request not found")
  request.status = action
  await request.save()
  return request
}

export const getConnections = async (userId: string) => {
  return await ConnectionModel.find({
    $or: [{ requester: userId }, { recipient: userId }]
  }).populate("requester recipient", "name email")
}


export const getAcceptedConnections = async (userId: string) => {
  const connections = await ConnectionModel.find({
    $or: [{ requester: userId }, { recipient: userId }],
    status: "accepted"
  })
    .populate<{ requester: IUser; recipient: IUser }>("requester", "name email role")
    .populate<{ requester: IUser; recipient: IUser }>("recipient", "name email role")


  return connections.map(conn => {
    const otherUser: IUser =
      conn.requester._id.toString() === userId ? conn.recipient : conn.requester

    return {
      connectionId: conn._id,
      status: conn.status,
      user: {
        _id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email,
        role: otherUser.role
      },
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt
    }
  })
}
