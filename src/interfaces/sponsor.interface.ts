import { Document, Types } from "mongoose";

export interface IRepresentative {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
}

export interface ISponsor extends Document {
  user: Types.ObjectId;
  companyName: string;
  logo?: string;
  website?: string;
  category?: string;
  description?: string;
  verified?: boolean;
  representatives?: IRepresentative[];
  createdAt?: Date;
  updatedAt?: Date;
}
