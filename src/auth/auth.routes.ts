import { Router } from "express"
import {
  sendOtp,
  verifyOtpAndSetPassword,
  login,
  forgotPassword,
  resetPassword,
  fetchAllUsers
} from "./auth.controller"

const router = Router()
router.get("/users", fetchAllUsers)
router.post("/send-otp", sendOtp)
router.post("/verify-otp", verifyOtpAndSetPassword)
router.post("/login", login)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password", resetPassword)

export default router
