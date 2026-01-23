export interface IUser extends Document {
  name: string
  email: string
  password?: string
  otp?: string
  otpExpires?: Date
  role: "user" | "admin" | "organizer" | "sponsor" | "exhibitor"
  createdAt: Date
  updatedAt: Date
}
