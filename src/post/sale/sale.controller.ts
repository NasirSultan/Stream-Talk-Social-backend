import { Request, Response } from "express"
import * as saleService from "./sale.service"

export const createSale = async (req: Request, res: Response) => {
  try {
    const postId = req.params.postId
    if (req.user) req.body.seller = req.user.id
    const sale = await saleService.createSale(postId, req.body)
    res.status(201).json(sale)
  } catch (error: unknown) {
    if (error instanceof Error) res.status(500).json({ message: error.message })
    else res.status(500).json({ message: "Unknown error" })
  }
}

export const getSalesByPost = async (req: Request, res: Response) => {
  try {
    const postId = req.params.postId
    const sales = await saleService.getSalesByPost(postId)
    res.status(200).json(sales)
  } catch (error: unknown) {
    if (error instanceof Error) res.status(500).json({ message: error.message })
    else res.status(500).json({ message: "Unknown error" })
  }
}

export const getSaleById = async (req: Request, res: Response) => {
  try {
    const { postId, id } = req.params
    const sale = await saleService.getSaleById(postId, id)
    res.status(200).json(sale)
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Sale not found") res.status(404).json({ message: error.message })
      else res.status(500).json({ message: error.message })
    } else res.status(500).json({ message: "Unknown error" })
  }
}

export const updateSale = async (req: Request, res: Response) => {
  try {
    const { postId, id } = req.params
    const sale = await saleService.updateSale(postId, id, req.body)
    res.status(200).json(sale)
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Sale not found") res.status(404).json({ message: error.message })
      else res.status(500).json({ message: error.message })
    } else res.status(500).json({ message: "Unknown error" })
  }
}

export const deleteSale = async (req: Request, res: Response) => {
  try {
    const { postId, id } = req.params
    await saleService.deleteSale(postId, id)
    res.status(200).json({ message: "Sale deleted successfully" })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Sale not found") res.status(404).json({ message: error.message })
      else res.status(500).json({ message: error.message })
    } else res.status(500).json({ message: "Unknown error" })
  }
}
