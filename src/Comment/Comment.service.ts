import { models } from "../models/model"
import { Types } from "mongoose"

const { Post, Comment } = models

export const createComment = async (content: string, postId: string, authorId: string, parentCommentId?: string) => {
  if (!content || !postId || !authorId) {
    throw new Error("Content, postId, and authorId are required")
  }

  const postExists = await Post.findById(postId)
  if (!postExists) throw new Error("Post not found")

  let parentCommentObjectId = null
  if (parentCommentId && parentCommentId.trim() !== "") {
    const parentExists = await Comment.findById(parentCommentId)
    if (!parentExists) throw new Error("Parent comment not found")
    parentCommentObjectId = new Types.ObjectId(parentCommentId)
  }

  const comment = await Comment.create({
    content,
    post: new Types.ObjectId(postId),
    author: new Types.ObjectId(authorId),
    parentComment: parentCommentObjectId
  })

  return comment
}


export const getCommentsByPost = async (postId: string) => {
  const postExists = await Post.findById(postId)
  if (!postExists) throw new Error("Post not found")

const comments = await Comment.find({ post: postId })
  .populate("author", "name email role")
  .sort({ createdAt: -1 })
  .lean() as any[]


  const commentMap: Record<string, any> = {}
  const rootComments: any[] = []

  comments.forEach(comment => {
    comment.replies = []
    commentMap[comment._id.toString()] = comment
  })

  comments.forEach(comment => {
    if (comment.parentComment) {
      const parent = commentMap[comment.parentComment.toString()]
      if (parent) parent.replies.push(comment)
    } else {
      rootComments.push(comment)
    }
  })

  return rootComments
}


export const updateComment = async (commentId: string, userId: string, content: string) => {
  const comment = await Comment.findById(commentId)
  if (!comment) throw new Error("Comment not found")
  if (comment.author.toString() !== userId) throw new Error("Unauthorized")

  comment.content = content
  await comment.save()
  return comment
}

export const deleteComment = async (commentId: string, userId: string) => {
  const comment = await Comment.findById(commentId)
  if (!comment) throw new Error("Comment not found")
  if (comment.author.toString() !== userId) throw new Error("Unauthorized")

  await Comment.deleteMany({ parentComment: comment._id })
  await comment.deleteOne()
  return { message: "Comment and its replies deleted successfully" }
}
