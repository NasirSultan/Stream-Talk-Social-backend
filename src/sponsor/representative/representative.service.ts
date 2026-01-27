import { Types } from "mongoose"
import { models } from "../../models/model"
import { IRepresentative } from "../../interfaces/representative.interface"

const { Sponsor } = models

export class RepresentativeService {
  async addRepresentative(userId: Types.ObjectId, data: IRepresentative) {
    return Sponsor.findOneAndUpdate(
      { user: userId },
      { $push: { representatives: data } },
      { new: true }
    )
  }

  async getRepresentatives(userId: Types.ObjectId) {
    const sponsor = await Sponsor.findOne({ user: userId })
    return sponsor?.representatives || []
  }

  async updateRepresentative(userId: Types.ObjectId, repId: Types.ObjectId, data: Partial<IRepresentative>) {
    return Sponsor.findOneAndUpdate(
      { user: userId, "representatives._id": repId },
      { $set: { "representatives.$": data } },
      { new: true }
    )
  }

  async deleteRepresentative(userId: Types.ObjectId, repId: Types.ObjectId) {
    return Sponsor.findOneAndUpdate(
      { user: userId },
      { $pull: { representatives: { _id: repId } } },
      { new: true }
    )
  }
}
