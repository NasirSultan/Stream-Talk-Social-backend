import { Types } from "mongoose"
import { models } from "../../models/model"
import { ISponsorRequest } from "../../interfaces/sponsorRequest.interface"
const { Event,Sponsor  } = models

export class SponsorRequestService {

  async createRequest(eventId: Types.ObjectId, userId: Types.ObjectId, category: "main" | "sub") {
    const event = await Event.findById(eventId)
    if (!event) throw new Error("Event not found")

    const sponsor = await Sponsor.findOne({ user: userId })
    if (!sponsor) throw new Error("User is not a sponsor")

    const existing = event.sponsorRequests?.find(r => r.sponsorId.equals(sponsor._id))
    if (existing) return existing

    const newRequest: ISponsorRequest = { sponsorId: sponsor._id, category, status: "pending" } as ISponsorRequest
    event.sponsorRequests?.push(newRequest)
    await event.save()
    return newRequest
  }

async getRequests(eventId: Types.ObjectId) {
  const event = await Event.findById(eventId).populate({
    path: "sponsorRequests.sponsorId",
    select: "companyName logo website category description"
  })
  if (!event) throw new Error("Event not found")
  return event.sponsorRequests || []
}


async updateStatus(eventId: Types.ObjectId, requestId: Types.ObjectId, status: "approved" | "rejected") {
  const event = await Event.findById(eventId)
  if (!event) throw new Error("Event not found")

  const request = (event.sponsorRequests as any).id(requestId)
  if (!request) throw new Error("Sponsor request not found")

  request.status = status
  await event.save()
  return { message: "Sponsor request updated successfully" }
}


  async deleteRequest(eventId: Types.ObjectId, requestId: Types.ObjectId) {
    const event = await Event.findById(eventId)
    if (!event) throw new Error("Event not found")

 const request = (event.sponsorRequests as any).id(requestId)

    if (!request) throw new Error("Sponsor request not found")

    request.remove()
    return event.save()
  }
}
