import { Router } from "express"
import {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct
} from "./product.controller"
import { authenticate } from "../../middlewares/auth.middleware"

const router = Router()

router.use(authenticate)

router.post("/", addProduct)
router.get("/", getProducts)
router.put("/:productId", updateProduct)
router.delete("/:productId", deleteProduct)

export default router
