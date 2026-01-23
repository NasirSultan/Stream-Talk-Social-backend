import { models } from "../models/model";
const { Interaction } = models;
import { InteractionType } from "../common/enums/interactionType.enum";
import { ReactionType } from "../common/enums/reactionType.enum";

export const toggleReaction = async (
  userId: string,
  targetId: string,
  targetType: "Post" | "Comment",
  reactionType: ReactionType
) => {
  if (!userId || !targetId || !targetType || !reactionType) {
    throw { status: 400, message: "All parameters are required" };
  }

  const existing = await Interaction.findOne({
    user: userId,
    targetId,
    targetType,
    interactionType: InteractionType.REACTION
  });

  if (existing) {
    if (existing.reactionType === reactionType) {
      await existing.deleteOne();
      return { message: "Reaction removed" };
    } else {
      existing.reactionType = reactionType;
      await existing.save();
      return { message: "Reaction updated" };
    }
  }

  const reaction = await Interaction.create({
    user: userId,
    targetId,
    targetType,
    interactionType: InteractionType.REACTION,
    reactionType
  });

  return { message: "Reaction added", data: reaction };
};

export const toggleBookmark = async (userId: string, postId: string) => {
  if (!userId || !postId) throw { status: 400, message: "UserId and PostId are required" };

  const existing = await Interaction.findOne({
    user: userId,
    targetId: postId,
    targetType: "Post",
    interactionType: InteractionType.BOOKMARK
  });

  if (existing) {
    await existing.deleteOne();
    return { message: "Bookmark removed" };
  }

  const bookmark = await Interaction.create({
    user: userId,
    targetId: postId,
    targetType: "Post",
    interactionType: InteractionType.BOOKMARK
  });

  return { message: "Bookmark added", data: bookmark };
};

export const addShare = async (userId: string, postId: string) => {
  if (!userId || !postId) throw { status: 400, message: "UserId and PostId are required" };

  const share = await Interaction.create({
    user: userId,
    targetId: postId,
    targetType: "Post",
    interactionType: InteractionType.SHARE
  });

  return { message: "Share added", data: share };
};

export const countInteractions = async (targetId: string, targetType: "Post" | "Comment") => {
  if (!targetId || !targetType) throw { status: 400, message: "TargetId and TargetType are required" };

  const reactions = await Interaction.find({ targetId, targetType, interactionType: InteractionType.REACTION });
  const bookmarks = await Interaction.countDocuments({ targetId, targetType, interactionType: InteractionType.BOOKMARK });
  const shares = await Interaction.countDocuments({ targetId, targetType, interactionType: InteractionType.SHARE });

  const reactionCount: Record<string, number> = {};
  reactions.forEach(r => {
    const type = r.reactionType!;
    reactionCount[type] = (reactionCount[type] || 0) + 1;
  });

  return { reactions: reactionCount, bookmarks, shares };
};
