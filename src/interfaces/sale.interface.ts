import { Document, Types } from "mongoose";

export interface Sale extends Document {
  post: Types.ObjectId;
  seller: Types.ObjectId;
  price: number;
  discountPercent?: number;
  finalPrice: number;
  status?: "active" | "completed" | "canceled";
  buyers?: { user: Types.ObjectId; purchasedAt: Date; paidPrice: number }[];
}
