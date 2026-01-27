import { Router } from "express"
import {
  addRepresentative,
  getRepresentatives,
  updateRepresentative,
  deleteRepresentative
} from "./representative.controller"
import { authenticate } from "../../middlewares/auth.middleware"

const router = Router()

router.use(authenticate)

router.post("/", addRepresentative)
router.get("/", getRepresentatives)
router.put("/:repId", updateRepresentative)
router.delete("/:repId", deleteRepresentative)

export default router
