import { Request, Response } from "express"
import { models } from "../models/model.ts"

const { User } = models


export const createUser = async (req: Request, res: Response) => {
  const user = await User.create(req.body)
  res.status(201).json(user)
}

export const getUsers = async (req: Request, res: Response) => {
  const users = await User.find()
  res.json(users)
}
