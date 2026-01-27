import { Request, Response } from "express"
import { RepresentativeService } from "./representative.service"
import { Types } from "mongoose"

const service = new RepresentativeService()

export const addRepresentative = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ message: "Unauthorized" })

  const sponsor = await service.addRepresentative(userId, req.body)
  res.status(201).json(sponsor)
}

export const getRepresentatives = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ message: "Unauthorized" })

  const reps = await service.getRepresentatives(userId)
  res.status(200).json(reps)
}

export const updateRepresentative = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ message: "Unauthorized" })

  const repId = new Types.ObjectId(req.params.repId)
  const sponsor = await service.updateRepresentative(userId, repId, req.body)

  if (!sponsor) return res.status(404).json({ message: "Representative not found" })
  res.status(200).json(sponsor)
}

export const deleteRepresentative = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ message: "Unauthorized" })

  const repId = new Types.ObjectId(req.params.repId)
  const sponsor = await service.deleteRepresentative(userId, repId)

  res.status(200).json(sponsor)
}
