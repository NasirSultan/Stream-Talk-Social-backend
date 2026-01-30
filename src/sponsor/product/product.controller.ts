import { Request, Response } from "express"
import { ProductService } from "./product.service"
import { Types } from "mongoose"

const service = new ProductService()

export const addProduct = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ message: "Unauthorized" })

  const sponsor = await service.addProduct(userId, req.body)
  res.status(201).json(sponsor)
}

export const getProducts = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ message: "Unauthorized" })

  const products = await service.getProducts(userId)
  res.status(200).json(products)
}

export const updateProduct = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ message: "Unauthorized" })

  const productId = new Types.ObjectId(req.params.productId)
  const sponsor = await service.updateProduct(userId, productId, req.body)

  if (!sponsor) return res.status(404).json({ message: "Product not found" })
  res.status(200).json(sponsor)
}

export const deleteProduct = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ message: "Unauthorized" })

  const productId = new Types.ObjectId(req.params.productId)
  const sponsor = await service.deleteProduct(userId, productId)

  res.status(200).json(sponsor)
}
