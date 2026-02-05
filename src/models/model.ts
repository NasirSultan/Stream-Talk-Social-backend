

import mongoose, { Schema } from "mongoose"
import { IUser } from "../interfaces/user.interface"
import { Post } from '../interfaces/post.interface'
import { Comment } from "../interfaces/comment.interface"
import { IInteraction } from "../interfaces/interaction.interface";
import { InteractionType } from "../common/enums/interactionType.enum";
import { ReactionType } from "../common/enums/reactionType.enum";
import { Sale } from "../interfaces/sale.interface";
import { SaleStatus } from "../common/enums/saleStatus.enum"
import { ISponsor } from "../interfaces/sponsor.interface";
import { IEvent } from "../interfaces/event.interface"
import { ISponsorRequest } from "../interfaces/sponsorRequest.interface"
import { Connection } from "../interfaces/Connection.interface"
import { IBooth } from "../interfaces/booth.interface"
import { IConversation } from "../interfaces/IConversation.interface"
import { IMessage } from "../interfaces/chat.interface"

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
     files: { type: [String] },
      frameValues: { type: String },     
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

const representativeSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String },
    email: { type: String },
    phone: { type: String },
    linkedIn: { type: String }
  },
  { _id: true }
)

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    media: { type: String },
    link: { type: String },
    category: { type: String }
  },
  { _id: true }
)

const sponsorSchema: Schema<ISponsor> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    companyName: { type: String, required: true },
    logo: { type: String },
    website: { type: String },
    category: { type: String },
    description: { type: String },
    verified: { type: Boolean, default: false },
    representatives: [representativeSchema],
        products: [productSchema]
  },
  { timestamps: true }
)
const Sponsor = mongoose.model<ISponsor>("Sponsor", sponsorSchema);


const ticketSchema = new Schema(
  {
    type: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
  },
  { _id: true }
)

const eventSponsorRequestSchema = new Schema<ISponsorRequest>(
  {
    sponsorId: { type: Schema.Types.ObjectId, ref: "Sponsor", required: true },
    category: { type: String, enum: ["main", "sub"], required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: true }
)

const purchaseSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ticketType: { type: String, required: true },
    quantity: { type: Number, required: true },
    token: { type: String, required: true },
    purchasedAt: { type: Date, default: Date.now }
  },
  { _id: true }
)

const eventSchema: Schema<IEvent> = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    mapLink: { type: String },
    location: { type: String },
    type: { type: String, enum: ["hybrid", "online"], required: true },
    token: { type: String, length: 6 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    publishForRegistration: { type: Boolean, default: false },
    tickets: {
      type: [ticketSchema],
      required: function () { return this.publishForRegistration === true }
    },
    totalCapacity: { type: Number },
    reservedTickets: { type: Number, default: 0 },
    sponsorId: { type: Schema.Types.ObjectId, ref: "Sponsor" },
     sponsorRequests: [eventSponsorRequestSchema],
         purchases: [purchaseSchema]
  },
  
  { timestamps: true }
)

eventSchema.pre("save", function () {
  if (this.publishForRegistration && this.tickets && this.tickets.length > 0) {
    const ticketsCapacity = this.tickets.reduce((acc, t) => acc + t.quantity, 0)
    const reserved = this.reservedTickets || 0
    this.totalCapacity = ticketsCapacity + reserved
  } else {
    this.reservedTickets = undefined
  }
})

const Event = mongoose.model<IEvent>("Event", eventSchema)

const connectionSchema: Schema<Connection> = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" }
  },
  { timestamps: true }
)

connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true })
 const ConnectionModel = mongoose.model<Connection>("Connection", connectionSchema)
 

const boothSchema: Schema<IBooth> = new Schema(
  {
    sponsor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    boothNumber: { type: String, required: true },
    boothLocation: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" }
  },
  { timestamps: true }
)


boothSchema.index({ event: 1, sponsor: 1 }, { unique: true }) 
boothSchema.index({ event: 1, boothNumber: 1 }, { unique: true })

 const Booth = mongoose.model<IBooth>("Booth", boothSchema)



const conversationSchema: Schema<IConversation> = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: {
      content: { type: String },
      sender: { type: Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date }
    },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }]
  },
  { timestamps: true }
)

conversationSchema.index({ participants: 1 })

const messageSchema: Schema<IMessage> = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    deletedFor: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    attachments: [{ type: String }]
  },
  { timestamps: true }
)

messageSchema.index({ conversationId: 1, createdAt: -1 })
messageSchema.index(
  { conversationId: 1, deletedFor: 1 },
  { partialFilterExpression: { deletedFor: { $size: 0 } } }
)

messageSchema.methods.deleteForUser = async function(userId: string) {
  const objectId = new mongoose.Types.ObjectId(userId)
  if (!this.deletedFor.includes(objectId)) {
    this.deletedFor.push(objectId)
    await this.save()
  }
}

const Conversation = mongoose.model<IConversation>("Conversation", conversationSchema)
const Message = mongoose.model<IMessage>("Message", messageSchema)






export const models = { User, Post, Comment, Interaction, Sale, Sponsor, Event, ConnectionModel, Booth, Conversation, Message }