import { IUser } from "../interfaces/user.interface.js"

declare module "express-serve-static-core" {
  interface Request {
    user?: IUser | any
  }
}
