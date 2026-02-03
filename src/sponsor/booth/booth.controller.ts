import { Request, Response } from "express"
import * as boothService from "./booth.service"

export const createBooth = async (req: Request, res: Response) => {
  try {
    const sponsorId = (req as any).user.id
    const { eventId } = req.params
    const { boothNumber, boothLocation } = req.body

    const booth = await boothService.createBooth(
      sponsorId,
      eventId,
      boothNumber,
      boothLocation
    )

    res.status(201).json(booth)
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export const getMyBoothByEvent = async (req: Request, res: Response) => {
  try {
    const sponsorId = (req as any).user.id
    const { eventId } = req.params

    const booth = await boothService.getSponsorBooth(sponsorId, eventId)
    res.json(booth)
  } catch (err: any) {
    res.status(404).json({ message: err.message })
  }
}

export const getEventBooths = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params
    const booths = await boothService.getEventBooths(eventId)
    res.json(booths)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}


export const getSponsorBooths = async (req: Request, res: Response) => {
  try {
    const sponsorId = (req as any).user.id
    const booths = await boothService.getSponsorBooths(sponsorId)
    res.json(booths)
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}