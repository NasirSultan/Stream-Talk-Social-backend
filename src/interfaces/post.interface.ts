import mongoose from "mongoose"
export interface Post {
  title: string
  content: string
 author: string | mongoose.Types.ObjectId
   files?: string[]
  frameValues?: string   
  createdAt?: Date
}
