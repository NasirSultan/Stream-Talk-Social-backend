import { Request, Response } from "express"
import { SponsorRequestService } from "./sponsorRequest.service"
import { Types } from "mongoose"

const service = new SponsorRequestService()

export const createRequest = async (req: Request, res: Response) => {
  try {
    const eventId = new Types.ObjectId(req.params.eventId)
    const userId = req.user?.id
    const { category } = req.body
    const request = await service.createRequest(eventId, new Types.ObjectId(userId), category)
    res.status(201).json(request)
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}


export const getRequests = async (req: Request, res: Response) => {
  try {
    const eventId = new Types.ObjectId(req.params.eventId)
    const requests = await service.getRequests(eventId)
    res.status(200).json(requests)
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const eventId = new Types.ObjectId(req.params.eventId)
    const requestId = new Types.ObjectId(req.params.requestId)
    const { status } = req.body

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const event = await service.updateStatus(eventId, requestId, status)
    res.status(200).json(event)
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export const deleteRequest = async (req: Request, res: Response) => {
  try {
    const eventId = new Types.ObjectId(req.params.eventId)
    const requestId = new Types.ObjectId(req.params.requestId)
    const event = await service.deleteRequest(eventId, requestId)
    res.status(200).json(event)
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}
