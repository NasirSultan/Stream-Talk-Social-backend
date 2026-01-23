import { Router } from "express"
import * as commentController from "./Comment.controller"
import { authenticate } from "../middlewares/auth.middleware"

const router = Router()

router.post("/:postId", authenticate, commentController.addComment)
router.get("/:postId", commentController.fetchComments)
router.put("/:commentId", authenticate, commentController.editComment)
router.delete("/:commentId", authenticate, commentController.removeComment)

export default router
