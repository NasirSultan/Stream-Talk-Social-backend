npm run dev         cmd for start

import { Document, Types } from "mongoose";

export interface IBooth extends Document {
  sponsor: Types.ObjectId;
  event: Types.ObjectId;
  name: string;
  location?: string;
  boothNumber?: string;
  description?: string;
  banner?: string;
  products?: Types.ObjectId[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
