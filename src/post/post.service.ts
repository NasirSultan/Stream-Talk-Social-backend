import { models } from "../models/model"
import { Types } from "mongoose"

import { uploadFileToImgbb } from "../utils/fileUpload"

const { Post, Interaction, Comment, Sale } = models
export const createPost = async (data: any) => {
  try {
    if (data.file) {
      data.file = await uploadFileToImgbb(data.file)
    }
    const post = new Post(data)
    return await post.save()
  } catch (error: unknown) {
    if (error instanceof Error) throw new Error("Failed to create post: " + error.message)
    throw new Error("Failed to create post")
  }
}

export const getPosts = async () => {
  try {
    return await Post.find().populate("author")
  } catch (error: unknown) {
    if (error instanceof Error) throw new Error("Failed to fetch posts: " + error.message)
    throw new Error("Failed to fetch posts")
  }
}

export const getPostById = async (id: string) => {
  try {
    const post = await Post.findById(id).populate("author")
    if (!post) throw new Error("Post not found")
    return post
  } catch (error: unknown) {
    if (error instanceof Error) throw new Error(error.message)
    throw new Error("Failed to fetch post")
  }
}

export const updatePost = async (id: string, data: any) => {
  try {
    if (data.file) {
      data.file = await uploadFileToImgbb(data.file)
    }
    const post = await Post.findByIdAndUpdate(id, data, { new: true })
    if (!post) throw new Error("Post not found")
    return post
  } catch (error: unknown) {
    if (error instanceof Error) throw new Error(error.message)
    throw new Error("Failed to update post")
  }
}

export const deletePost = async (id: string) => {
  try {
    const post = await Post.findByIdAndDelete(id)
    if (!post) throw new Error("Post not found")
    return post
  } catch (error: unknown) {
    if (error instanceof Error) throw new Error(error.message)
    throw new Error("Failed to delete post")
  }
}





export const getFeedPosts = async (userId: string, cursor?: string) => {
  const limit = 10
  const query: any = {}
  if (cursor) query._id = { $lt: cursor }

  const now = new Date()
  const trendingWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const trendingAgg = await Interaction.aggregate([
    { $match: { createdAt: { $gte: trendingWindow }, targetType: "Post" } },
    { $group: { _id: "$targetId", totalInteractions: { $sum: 1 } } },
    { $sort: { totalInteractions: -1 } },
    { $limit: limit * 2 }
  ])
  const trendingPostIds = trendingAgg.map(p => p._id)

  const userInterestPosts = await Post.find({
    author: { $in: [] }
  }).sort({ createdAt: -1 }).lean()

  const latestPosts = await Post.find(query).sort({ createdAt: -1 }).limit(limit * 2).lean()

  const combinedPostIds = Array.from(
    new Set([...trendingPostIds, ...userInterestPosts.map(p => p._id), ...latestPosts.map(p => p._id)])
  ).slice(0, limit * 3)

  const posts = await Post.find({ _id: { $in: combinedPostIds } })
    .populate({ path: "author", select: "name file" })
    .lean()

  const shuffledPosts = posts
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)
    .slice(0, limit)

  const postIds = shuffledPosts.map(p => p._id)

  const interactions = await Interaction.aggregate([
    { $match: { targetId: { $in: postIds }, targetType: "Post" } },
    {
      $group: {
        _id: "$targetId",
        totalLikes: { $sum: { $cond: [{ $eq: ["$reactionType", "like"] }, 1, 0] } },
        totalShares: { $sum: { $cond: [{ $eq: ["$reactionType", "share"] }, 1, 0] } },
        usersLikes: { $push: { $cond: [{ $eq: ["$reactionType", "like"] }, "$user", null] } },
        usersShares: { $push: { $cond: [{ $eq: ["$reactionType", "share"] }, "$user", null] } }
      }
    }
  ])

  const comments = await Comment.aggregate([
    { $match: { post: { $in: postIds } } },
    { $group: { _id: "$post", totalComments: { $sum: 1 }, usersCommented: { $push: "$author" } } }
  ])

  return shuffledPosts.map(post => {
    const interaction = interactions.find(i => i._id.toString() === post._id.toString())
    const comment = comments.find(c => c._id.toString() === post._id.toString())

   const likedUsers = (interaction?.usersLikes || [])
  .filter((u: Types.ObjectId | null) => u != null)
  .map((u: Types.ObjectId) => u.toString())

const sharedUsers = (interaction?.usersShares || [])
  .filter((u: Types.ObjectId | null) => u != null)
  .map((u: Types.ObjectId) => u.toString())

const commentedUsers = (comment?.usersCommented || [])
  .filter((u: Types.ObjectId | null) => u != null)
  .map((u: Types.ObjectId) => u.toString())


    return {
      ...post,
      totalLikes: interaction?.totalLikes || 0,
      totalShares: interaction?.totalShares || 0,
      totalComments: comment?.totalComments || 0,
      likedByUser: likedUsers.includes(userId) ? "like" : false,
      sharedByUser: sharedUsers.includes(userId) ? "share" : false,
      commentedByUser: commentedUsers.includes(userId)
    }
  })
}