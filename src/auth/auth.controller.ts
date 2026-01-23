import { Request, Response, NextFunction } from "express"
import {
  createOrUpdateOtp,
  verifyOtpAndSetPassword as verifyOtpService,
  loginUser,
  forgotPasswordOtp,
  resetUserPassword,
  getAllUsers
} from "./auth.service"

export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email } = req.body
    if (!name || !email) return res.status(400).json({ message: "Name and email required" })

    const otp = await createOrUpdateOtp(name, email)
    res.status(200).json({ message: "Email already exists", otp })
  } catch (err) {
    next(err)
  }
}

export const verifyOtpAndSetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, password } = req.body
    await verifyOtpService(email, otp, password)
    res.status(200).json({ message: "Password set successfully" })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body
    const token = await loginUser(email, password)
    res.status(200).json({ message: "Login successful", token })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body
    const otp = await forgotPasswordOtp(email)
    res.status(200).json({ message: "OTP sent to email", otp })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, password } = req.body
    await resetUserPassword(email, otp, password)
    res.status(200).json({ message: "Password reset successfully" })
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}


export const fetchAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await getAllUsers()
    res.status(200).json(users)
  } catch (err: any) {
    res.status(400).json({ message: err.message })
  }
}