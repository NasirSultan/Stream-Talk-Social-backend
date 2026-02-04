import { Router } from "express"
import * as postController from "./post.controller"
import { upload } from "../utils/multer"
import { authenticate } from "../middlewares/auth.middleware"
import saleRouter from "./sale/sale.router"


const router = Router()

router.get("/feed", authenticate, postController.getFeed)
router.post("/", authenticate, upload.array("files", 5), postController.createPost)
router.get("/", postController.getPosts)
router.get("/:id", postController.getPostById)
router.put("/:id", authenticate, postController.updatePost)
router.delete("/:id", postController.deletePost)

router.use("/:postId/sales", saleRouter)
export default router
