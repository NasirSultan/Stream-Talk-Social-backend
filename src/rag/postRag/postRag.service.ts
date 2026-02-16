import chromaClient from "../chroma.client"
import { llm } from "../../lib/llm"

const COLLECTION_NAME = "posts"
const CHUNK_SIZE = 200
const CHUNK_OVERLAP = 30
const CONTEXT_WORD_LIMIT = 600
const SIMILARITY_THRESHOLD = 1.8

function splitIntoWordChunksWithOverlap(text: string, maxWords: number, overlap: number): string[] {
  const allWords = text.split(/\s+/).filter(Boolean)
  const chunks: string[] = []
  let index = 0

  while (index < allWords.length) {
    const slice = allWords.slice(index, index + maxWords)
    chunks.push(slice.join(" "))
    index += maxWords - overlap
  }

  return chunks
}

function buildPostContent(postData: any): string {
  let content = `${postData.title}\n${postData.content || ""}\n`

  if (postData.category) content += `Category: ${postData.category}\n`
  if (Array.isArray(postData.tags) && postData.tags.length) {
    content += `Tags: ${postData.tags.join(", ")}\n`
  }

  return content.trim()
}

export class PostRagService {
  async addPostDocument(postData: any) {
    if (!postData?._id || !postData?.title) {
      throw new Error("Invalid post data: _id and title are required")
    }

    const collection = await chromaClient.getOrCreateCollection({ name: COLLECTION_NAME })

    const postId = postData._id.toString()
    const content = buildPostContent(postData)

    await collection.delete({ where: { postId } })

    const chunks = splitIntoWordChunksWithOverlap(content, CHUNK_SIZE, CHUNK_OVERLAP)

    const ids = chunks.map((_, i) => `${postId}_${i}`)

    const metadatas = chunks.map(() => ({
      postId,
      authorId: postData.authorId?.toString() || "",
      category: postData.category || "",
      tags: Array.isArray(postData.tags) ? postData.tags.join(",") : ""
    }))

    await collection.add({
      ids,
      documents: chunks,
      metadatas
    })

    return { success: true, postId, chunksAdded: chunks.length }
  }

async queryPostDocument(query: string, topK = 5) {
  if (!query?.trim()) {
    throw new Error("query is required")
  }

  const collection = await chromaClient.getOrCreateCollection({ name: COLLECTION_NAME })

  const result = await collection.query({
    queryTexts: [query],
    nResults: topK,
    include: ["documents", "distances"] as any
  })

  const rawDocs = result.documents?.[0] || []
  const rawDistances = (result as any).distances?.[0] || []

  const docs = rawDocs.filter((doc, i): doc is string => {
    return typeof doc === "string" && (rawDistances[i] ?? Infinity) <= SIMILARITY_THRESHOLD
  })

  if (!docs.length) {
    return { answer: [], sourcesUsed: 0 }
  }

  const combinedWords: string[] = []

  for (const doc of docs) {
    const words = doc.split(/\s+/).filter(Boolean)
    const remaining = CONTEXT_WORD_LIMIT - combinedWords.length
    if (remaining <= 0) break
    combinedWords.push(...words.slice(0, remaining))
  }

  const context = combinedWords.join(" ")

  const aiMessage = await llm.invoke([
    {
      role: "system",
      content:
        "You are a helpful post assistant. Answer strictly based on context. If not found, say so. Respond only in bullet points."
    },
    {
      role: "user",
      content: `Context:\n${context}\n\nQuestion:\n${query}`
    }
  ])

  let answerText = ""

  if (typeof aiMessage.content === "string") {
    answerText = aiMessage.content
  } else {
    answerText = aiMessage.content
      .map((v) => ("text" in v ? v.text : ""))
      .join("")
  }

  return {
    answer: answerText
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean),
    sourcesUsed: docs.length
  }
}


  async deletePostDocument(postId: string) {
    if (!postId) {
      throw new Error("postId is required")
    }

    const collection = await chromaClient.getOrCreateCollection({ name: COLLECTION_NAME })

    await collection.delete({ where: { postId } })

    return { success: true, postId }
  }
}
