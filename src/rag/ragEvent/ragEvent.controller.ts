import { Request, Response } from "express";
import { RagEventService } from "./ragEvent.service";

const service = new RagEventService();

export class RagEventController {
  async addEvent(req: Request, res: Response) {
    const { eventId, content, metadata } = req.body;
    if (!eventId || !content || !metadata) {
      return res.status(400).json({ error: "eventId, content, and metadata are required" });
    }
    const result = await service.addEventDocument(eventId, content, metadata);
    res.json(result);
  }

async queryEvent(req: Request, res: Response) {
  const { eventId, query, topK } = req.body;

  if (!query) {
    return res.status(400).json({ error: "query is required" });
  }

  const result = await service.queryEventDocument(eventId || undefined, query, topK);

  res.json(result);
}

}
