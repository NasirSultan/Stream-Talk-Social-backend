import { models } from "../../models/model"

const { Event, Sponsor, Booth } = models


export const createBooth = async (
  sponsorId: string,
  eventId: string,
  boothNumber: string,
  boothLocation: string
) => {
  const event = await Event.findById(eventId)
  if (!event) throw new Error("Event not found")

  const sponsor = await Sponsor.findOne({ user: sponsorId })
  if (!sponsor) throw new Error("Sponsor not found")


  const exists = await Booth.findOne({ sponsor: sponsorId, event: eventId })
  if (exists) throw new Error("Booth already exists for this event")

  return await Booth.create({
    sponsor: sponsorId,
    event: eventId,
    boothNumber,
    boothLocation
  })
}

export const getSponsorBooth = async (sponsorId: string, eventId: string) => {
  const booth = await Booth.findOne({ sponsor: sponsorId, event: eventId })
    .populate("event", "title")
  if (!booth) throw new Error("Booth not found")
  return booth
}

export const getEventBooths = async (eventId: string) => {
  return await Booth.find({ event: eventId })
    .populate("sponsor", "name email")
}

export const getSponsorBooths = async (sponsorId: string) => {
  return await Booth.find({ sponsor: sponsorId })
    .populate("event", "title startTime endTime location")
}