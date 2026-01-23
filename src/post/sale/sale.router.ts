import { Router } from "express"
import * as saleController from "./sale.controller"
import { authenticate } from "../../middlewares/auth.middleware"

const router = Router({ mergeParams: true })

router.post("/", authenticate, saleController.createSale)
router.get("/", saleController.getSalesByPost)
router.get("/:id", saleController.getSaleById)
router.put("/:id", authenticate, saleController.updateSale)
router.delete("/:id", authenticate, saleController.deleteSale)

export default router
