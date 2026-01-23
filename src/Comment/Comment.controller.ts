import { Request, Response, NextFunction } from "express"
import * as commentService from "./Comment.service"

export const addComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, parentComment } = req.body
    const postId = req.params.postId
    const authorId = req.user.id

    const comment = await commentService.createComment(content, postId, authorId, parentComment)
    res.status(201).json(comment)
  } catch (error) {
    next(error)
  }
}

export const fetchComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = req.params.postId
    const comments = await commentService.getCommentsByPost(postId)
    res.json(comments)
  } catch (error) {
    next(error)
  }
}

export const editComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body
    const commentId = req.params.commentId
    const userId = req.user.id

    const updatedComment = await commentService.updateComment(commentId, userId, content)
    res.json(updatedComment)
  } catch (error) {
    next(error)
  }
}

export const removeComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commentId = req.params.commentId
    const userId = req.user.id

    const result = await commentService.deleteComment(commentId, userId)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
