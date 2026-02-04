import { Request, Response } from "express"
import * as postService from "./post.service"
import { MulterError } from "multer"

export const createPost = async (req: Request, res: Response) => {
 try {
    const data = req.body
    if (req.files && Array.isArray(req.files)) {
      data.files = req.files.map(file => file.buffer)   // store multiple files
    }
    if (req.user) data.author = req.user.id

    const post = await postService.createPost(data)
    res.status(201).json(post)
  } catch (error: unknown) {
    if (error instanceof MulterError) {
      res.status(400).json({ message: error.message })
    } else if (error instanceof Error) {
      if (error.message.includes("validation failed") || error.message.includes("required")) {
        res.status(400).json({ message: error.message })
      } else if (error.message === "Post not found") {
        res.status(404).json({ message: error.message })
      } else {
        res.status(500).json({ message: error.message })
      }
    } else {
      res.status(500).json({ message: "Unknown error occurred" })
    }
  }
}

export const getPosts = async (req: Request, res: Response) => {
  try {
    const posts = await postService.getPosts()
    res.status(200).json(posts)
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message })
    } else {
      res.status(500).json({ message: "Unknown error occurred" })
    }
  }
}

export const getPostById = async (req: Request, res: Response) => {
  try {
    const post = await postService.getPostById(req.params.id)
    res.status(200).json(post)
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Post not found") {
        res.status(404).json({ message: error.message })
      } else {
        res.status(500).json({ message: error.message })
      }
    } else {
      res.status(500).json({ message: "Unknown error occurred" })
    }
  }
}

export const updatePost = async (req: Request, res: Response) => {
  try {
    const post = await postService.updatePost(req.params.id, req.body)
    res.status(200).json(post)
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Post not found") {
        res.status(404).json({ message: error.message })
      } else if (error.message.includes("validation failed") || error.message.includes("required")) {
        res.status(400).json({ message: error.message })
      } else {
        res.status(500).json({ message: error.message })
      }
    } else {
      res.status(500).json({ message: "Unknown error occurred" })
    }
  }
}

export const deletePost = async (req: Request, res: Response) => {
  try {
    await postService.deletePost(req.params.id)
    res.status(200).json({ message: "Post deleted successfully" })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Post not found") {
        res.status(404).json({ message: error.message })
      } else {
        res.status(500).json({ message: error.message })
      }
    } else {
      res.status(500).json({ message: "Unknown error occurred" })
    }
  }
}

export const getFeed = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id
    const cursor = req.query.cursor as string | undefined

    const posts = await postService.getFeedPosts(userId, cursor)

    const nextCursor = posts.length ? posts[posts.length - 1]._id : null

    res.status(200).json({
      posts,
      nextCursor
    })
  } catch (error: unknown) {
    if (error instanceof Error) res.status(500).json({ message: error.message })
    else res.status(500).json({ message: "Unknown error occurred" })
  }
}