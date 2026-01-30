import { Types } from "mongoose"
import { models } from "../../models/model"
import { IProduct } from "../../interfaces/product.interface"

const { Sponsor } = models

export class ProductService {
  async addProduct(userId: Types.ObjectId, data: IProduct) {
    return Sponsor.findOneAndUpdate(
      { user: userId },
      { $push: { products: data } },
      { new: true }
    )
  }

  async getProducts(userId: Types.ObjectId) {
    const sponsor = await Sponsor.findOne({ user: userId })
    return sponsor?.products || []
  }

  async updateProduct(userId: Types.ObjectId, productId: Types.ObjectId, data: Partial<IProduct>) {
    return Sponsor.findOneAndUpdate(
      { user: userId, "products._id": productId },
      { $set: { "products.$": data } },
      { new: true }
    )
  }

  async deleteProduct(userId: Types.ObjectId, productId: Types.ObjectId) {
    return Sponsor.findOneAndUpdate(
      { user: userId },
      { $pull: { products: { _id: productId } } },
      { new: true }
    )
  }
}
