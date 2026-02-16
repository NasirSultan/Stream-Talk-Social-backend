import { EventEmitter } from "events"
import { PostRagService } from "./postRag.service"

export const postEventEmitter = new EventEmitter()

postEventEmitter.on("postCreated", async (postData: any) => {
  try {
    const service = new PostRagService()
    await service.addPostDocument(postData)
  } catch (err) {
    console.error("[PostRag] postCreated handler failed:", err)
  }
})

postEventEmitter.on("postDeleted", async (postId: string) => {
  try {
    const service = new PostRagService()
    await service.deletePostDocument(postId)
  } catch (err) {
    console.error("[PostRag] postDeleted handler failed:", err)
  }
})
