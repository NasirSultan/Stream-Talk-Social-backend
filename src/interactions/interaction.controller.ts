import { Request, Response, NextFunction } from "express";
import * as interactionService from "./interaction.service";

const handleError = (res: Response, error: any) => {
  const status = error.status || 500;
  const message = error.message || "Internal Server Error";
  res.status(status).json({ error: message });
};

export const react = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetId, targetType, reactionType } = req.body;
    const userId = req.user.id;
    const result = await interactionService.toggleReaction(userId, targetId, targetType, reactionType);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

export const bookmark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;
    const result = await interactionService.toggleBookmark(userId, postId);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

export const share = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;
    const result = await interactionService.addShare(userId, postId);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

export const getCounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetId, targetType } = req.params;
    const counts = await interactionService.countInteractions(targetId, targetType as "Post" | "Comment");
    res.status(200).json(counts);
  } catch (error) {
    handleError(res, error);
  }
};
