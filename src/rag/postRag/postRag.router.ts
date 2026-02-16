import { Router } from "express"
import { PostRagController } from "./postRag.controller"

const router = Router()
const controller = new PostRagController()

router.post("/add", controller.addPost.bind(controller))
router.post("/query", controller.queryPost.bind(controller))
router.post("/delete", controller.deletePost.bind(controller))

export default router
