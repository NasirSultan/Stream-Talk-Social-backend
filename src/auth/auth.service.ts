import { models } from "../models/model"
const { User } = models
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "secretkey"


export const createOrUpdateOtp = async (name: string, email: string): Promise<string> => {
  let user = await User.findOne({ email })
  if (user) {
    if (user.otp && user.otpExpires && user.otpExpires > new Date()) {
      return user.otp
    }
  } else {
    user = new User({ name, email })
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    user.otp = otp
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()
    return otp
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  user.otp = otp
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000)
  await user.save()
  return otp
}

export const verifyOtpAndSetPassword = async (email: string, otp: string, password: string): Promise<void> => {
  const user = await User.findOne({ email })
  if (!user) throw new Error("User not found")

  if (user.otp !== otp || user.otpExpires! < new Date()) throw new Error("Invalid or expired OTP")

  const hashed = await bcrypt.hash(password, 10)
  user.password = hashed
  user.otp = undefined
  user.otpExpires = undefined
  await user.save()
}


export const loginUser = async (email: string, password: string): Promise<string> => {
  const user = await User.findOne({ email })
  if (!user || !user.password) throw new Error("Invalid credentials")

  const match = await bcrypt.compare(password, user.password)
  if (!match) throw new Error("Invalid credentials")

  const payload = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  }

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" })
  return token
}

export const forgotPasswordOtp = async (email: string): Promise<string> => {
  const user = await User.findOne({ email })
  if (!user) throw new Error("User not found")

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  user.otp = otp
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000)
  await user.save()

  return otp
}

export const resetUserPassword = async (email: string, otp: string, password: string): Promise<void> => {
  const user = await User.findOne({ email })
  if (!user) throw new Error("User not found")

  if (user.otp !== otp || user.otpExpires! < new Date()) throw new Error("Invalid or expired OTP")

  const hashed = await bcrypt.hash(password, 10)
  user.password = hashed
  user.otp = undefined
  user.otpExpires = undefined
  await user.save()
}

export const getAllUsers = async () => {
  const users = await User.find({}, { name: 1, email: 1, password: 1 })
  return users.map(user => ({
    userId: user._id,
    name: user.name,
    email: user.email,
    password: user.password
  }))
}