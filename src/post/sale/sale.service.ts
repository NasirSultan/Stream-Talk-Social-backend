import { models } from "../../models/model"
import { Types } from "mongoose"

const { Sale } = models

export const createSale = async (postId: string, data: any) => {
  data.post = postId
  const sale = new Sale(data)
  return sale.save()
}

export const getSalesByPost = async (postId: string) => {
  return Sale.find({ post: postId }).populate("seller buyers.user")
}

export const getSaleById = async (postId: string, saleId: string) => {
  const sale = await Sale.findOne({ _id: saleId, post: postId }).populate("seller buyers.user")
  if (!sale) throw new Error("Sale not found")
  return sale
}

export const updateSale = async (postId: string, saleId: string, data: any) => {
  const sale = await Sale.findOneAndUpdate({ _id: saleId, post: postId }, data, { new: true })
  if (!sale) throw new Error("Sale not found")
  return sale
}

export const deleteSale = async (postId: string, saleId: string) => {
  const result = await Sale.findOneAndDelete({ _id: saleId, post: postId })
  if (!result) throw new Error("Sale not found")
  return result
}
