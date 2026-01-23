import { Document, Types } from "mongoose";
import { InteractionType } from "../common/enums/interactionType.enum";
import { ReactionType } from "../common/enums/reactionType.enum";

export interface IInteraction extends Document {
  user: Types.ObjectId;
  targetId: Types.ObjectId;
  targetType: "Post" | "Comment";
  interactionType: InteractionType;
  reactionType?: ReactionType;
  createdAt: Date;
  updatedAt: Date;
}
