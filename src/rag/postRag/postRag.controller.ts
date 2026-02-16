import { Request, Response } from "express"
import { PostRagService } from "./postRag.service"
import { postEventEmitter } from "./postRag.events"

const service = new PostRagService()

export class PostRagController {
  async addPost(req: Request, res: Response) {
    const postData = req.body
    try {
      const result = await service.addPostDocument(postData)
      postEventEmitter.emit("postCreated", postData)
      res.json(result)
    } catch (err) {
      res.status(500).json({ error: "Failed to add post document" })
    }
  }

  async queryPost(req: Request, res: Response) {
    const { postId, query, topK } = req.body
    if (!query) {
      return res.status(400).json({ error: "query is required" })
    }
    const result = await service.queryPostDocument( query, topK)
    res.json(result)
  }

  async deletePost(req: Request, res: Response) {
    const { postId } = req.body
    if (!postId) {
      return res.status(400).json({ error: "postId is required" })
    }

    try {
      const result = await service.deletePostDocument(postId)
      postEventEmitter.emit("postDeleted", postId)
      res.json(result)
    } catch (err) {
      res.status(500).json({ error: "Failed to delete post document" })
    }
  }
}
