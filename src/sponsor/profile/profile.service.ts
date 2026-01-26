import { models } from "../../models/model"


const { Sponsor } = models

import { ISponsor } from "../../interfaces/sponsor.interface";
import { Types } from "mongoose";

export class ProfileService {
  async createProfile(userId: Types.ObjectId, data: Partial<ISponsor>): Promise<ISponsor> {
    const existing = await Sponsor.findOne({ user: userId });
    if (existing) throw new Error("Profile already exists");
    const sponsor = new Sponsor({ user: userId, ...data });
    return sponsor.save();
  }

  async getProfile(userId: Types.ObjectId): Promise<ISponsor | null> {
    return Sponsor.findOne({ user: userId });
  }

  async updateProfile(userId: Types.ObjectId, data: Partial<ISponsor>): Promise<ISponsor | null> {
    return Sponsor.findOneAndUpdate({ user: userId }, data, { new: true });
  }
}
