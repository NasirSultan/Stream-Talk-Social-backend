import mongoose, { Schema } from "mongoose"
import { IUser } from "../interfaces/user.interface"
import { Post } from '../interfaces/post.interface'
import { Comment } from "../interfaces/comment.interface"
import { IInteraction } from "../interfaces/interaction.interface";
import { InteractionType } from "../common/enums/interactionType.enum";
import { ReactionType } from "../common/enums/reactionType.enum";
import { Sale } from "../interfaces/sale.interface";
import { SaleStatus } from "../common/enums/saleStatus.enum"

const userSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    otp: { type: String },
    otpExpires: { type: Date },
    role: { type: String, enum: ["user", "admin", "organizer", "sponsor", "exhibitor"], default: "user" }
  },
  { timestamps: true }
)

const postSchema: Schema<Post> = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    file: { type: String },
    createdAt: { type: Date, default: Date.now }
  }
)


const saleSchema = new Schema<Sale>(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    price: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    finalPrice: { type: Number }, // remove required: true
    status: { type: String, enum: Object.values(SaleStatus), default: SaleStatus.ACTIVE },
    buyers: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        purchasedAt: { type: Date, default: Date.now },
        paidPrice: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

saleSchema.pre("save", function () {
  if (this.price != null) {
    this.finalPrice = this.price - (this.price * (this.discountPercent || 0)) / 100
  } else {
    this.finalPrice = 0
  }
})



const Sale = mongoose.model<Sale>("Sale", saleSchema);



const commentSchema: Schema<Comment> = new Schema(
  {
    content: { type: String, required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parentComment: { type: Schema.Types.ObjectId, ref: "Comment", default: null }
  },
  { timestamps: true }
)
commentSchema.index({ post: 1, createdAt: -1 })      
commentSchema.index({ parentComment: 1 })           
commentSchema.index({ author: 1 })   
const Comment = mongoose.model<Comment>("Comment", commentSchema)


const User = mongoose.model<IUser>("User", userSchema)
const Post = mongoose.model<Post>("Post", postSchema)


const interactionSchema: Schema<IInteraction> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    targetType: { type: String, enum: ["Post", "Comment"], required: true },
    interactionType: { type: String, enum: Object.values(InteractionType), required: true },
    reactionType: { type: String, enum: Object.values(ReactionType) }
  },
  { timestamps: true }
);
interactionSchema.index({ user: 1, targetId: 1, interactionType: 1 }, { unique: true });

const Interaction = mongoose.model<IInteraction>("Interaction", interactionSchema);


export const models = { User, Post, Comment, Interaction, Sale }