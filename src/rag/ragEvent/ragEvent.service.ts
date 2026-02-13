// import chromaClient from "../chroma.client";
// import { llm } from "../../lib/llm";
// import { EventEmitter } from "events";
// export const eventEmitter = new EventEmitter();
// function splitIntoWordChunks(text: string, maxWords: number) {
//   const allWords = text.split(/\s+/).filter(Boolean);
//   const chunks: string[] = [];
//   let index = 0;
//   while (index < allWords.length) {
//     const slice = allWords.slice(index, index + maxWords);
//     chunks.push(slice.join(" "));
//     index += maxWords;
//   }
//   return chunks;
// }

// export class RagEventService {
//   async addEventDocument(eventId: string, content: string, metadata: Record<string, any>) {
//     const collection = await chromaClient.getOrCreateCollection({ name: "events" });
//     await collection.delete({ where: { eventId } });
//     const chunks = splitIntoWordChunks(content, 200);
//     const ids = chunks.map((_, i) => `${eventId}_${i}`);
//     const metadatas = chunks.map(() => ({ eventId, ...metadata }));
//     await collection.add({ ids, documents: chunks, metadatas });
//     return { success: true, eventId, chunksAdded: chunks.length };
//   }

// async queryEventDocument(eventId: string | undefined, query: string, topK = 5) {
//   const collection = await chromaClient.getOrCreateCollection({ name: "events" });

//   const whereFilter = eventId ? { eventId } : undefined; // If no eventId, search all

//   const result = await collection.query({
//     queryTexts: [query],
//     nResults: topK,
//     where: whereFilter,
//   });

//   const docs = (result.documents?.[0] || []).filter((v): v is string => typeof v === "string");

//   if (!docs.length) {
//     return { answer: [], sourcesUsed: 0 };
//   }

//   let combinedWords: string[] = [];

//   for (const doc of docs) {
//     const words = doc.split(/\s+/).filter(Boolean);
//     if (combinedWords.length + words.length <= 300) {
//       combinedWords.push(...words);
//     } else {
//       const remaining = 300 - combinedWords.length;
//       if (remaining > 0) {
//         combinedWords.push(...words.slice(0, remaining));
//       }
//       break;
//     }
//   }

//   const context = combinedWords.join(" ");

//   const aiMessage = await llm.invoke(
//     `Answer only in bullet points.\nContext:\n${context}\nQuestion:\n${query}`
//   );

//   let answerText = "";

//   if (typeof aiMessage.content === "string") {
//     answerText = aiMessage.content;
//   } else {
//     answerText = aiMessage.content
//       .map(v => ("text" in v ? v.text : ""))
//       .join("");
//   }

//   return {
//     answer: answerText
//       .split("\n")
//       .map(v => v.trim())
//       .filter(Boolean),
//     sourcesUsed: docs.length,
//   };
// }


// async addEventDetail(eventData: any) {
//   if (!eventData || !eventData._id || !eventData.title) {
//     throw new Error("Invalid event data for Chroma DB insertion");
//   }

//   const collection = await chromaClient.getOrCreateCollection({ name: "events" });

//   let content = `${eventData.title}\n${eventData.description || ""}\n`;
//   if (eventData.location) content += `Location: ${eventData.location}\n`;
//   if (eventData.mapLink) content += `Map: ${eventData.mapLink}\n`;
//   if (eventData.type) content += `Type: ${eventData.type}\n`;
//   if (eventData.startTime) content += `Start Time: ${new Date(eventData.startTime).toISOString()}\n`;
//   if (eventData.endTime) content += `End Time: ${new Date(eventData.endTime).toISOString()}\n`;
//   if (typeof eventData.reservedTickets === "number") content += `Reserved Tickets: ${eventData.reservedTickets}\n`;

//   if (Array.isArray(eventData.tickets) && eventData.tickets.length) {
//     content += "Tickets:\n";
//     for (const ticket of eventData.tickets) {
//       content += `- ${ticket.type}: $${ticket.price}, Quantity: ${ticket.quantity}\n`;
//     }
//   }

//   const chunks = splitIntoWordChunks(content, 200);
//   const ids = chunks.map((_, i) => `${eventData._id}_${i}`);
//   const metadatas = chunks.map(() => ({ eventId: eventData._id.toString() }));

//   await collection.add({ ids, documents: chunks, metadatas });

//   return { success: true, eventId: eventData._id, chunksAdded: chunks.length };
// }

  
// }
// eventEmitter.on("eventCreated", async (eventData) => {
//   const service = new RagEventService();
//   await service.addEventDetail(eventData);
// });

import chromaClient from "../chroma.client";
import { llm } from "../../lib/llm";
import { EventEmitter } from "events";

export const eventEmitter = new EventEmitter();

const COLLECTION_NAME = "events";
const CHUNK_SIZE = 200;
const CHUNK_OVERLAP = 30;
const CONTEXT_WORD_LIMIT = 600;
const SIMILARITY_THRESHOLD = 1.8;

function splitIntoWordChunksWithOverlap(text: string, maxWords: number, overlap: number): string[] {
  const allWords = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let index = 0;

  while (index < allWords.length) {
    const slice = allWords.slice(index, index + maxWords);
    chunks.push(slice.join(" "));
    index += maxWords - overlap;
  }

  return chunks;
}

function buildEventContent(eventData: any): string {
  let content = `${eventData.title}\n${eventData.description || ""}\n`;
  if (eventData.location) content += `Location: ${eventData.location}\n`;
  if (eventData.mapLink) content += `Map: ${eventData.mapLink}\n`;
  if (eventData.type) content += `Type: ${eventData.type}\n`;
  if (eventData.startTime) content += `Start Time: ${new Date(eventData.startTime).toISOString()}\n`;
  if (eventData.endTime) content += `End Time: ${new Date(eventData.endTime).toISOString()}\n`;
  if (typeof eventData.reservedTickets === "number")
    content += `Reserved Tickets: ${eventData.reservedTickets}\n`;

  if (Array.isArray(eventData.tickets) && eventData.tickets.length) {
    content += "Tickets:\n";
    for (const ticket of eventData.tickets) {
      content += `- ${ticket.type}: $${ticket.price}, Quantity: ${ticket.quantity}\n`;
    }
  }

  return content.trim();
}

export class RagEventService {
  async addEventDocument(
    eventId: string,
    content: string,
    metadata: Record<string, any>
  ) {
    if (!eventId || !content?.trim()) {
      throw new Error("eventId and content are required");
    }

    try {
      const collection = await chromaClient.getOrCreateCollection({ name: COLLECTION_NAME });
      await collection.delete({ where: { eventId } });

      const chunks = splitIntoWordChunksWithOverlap(content, CHUNK_SIZE, CHUNK_OVERLAP);
      const ids = chunks.map((_, i) => `${eventId}_${i}`);
      const metadatas = chunks.map(() => ({ eventId, ...metadata }));

      await collection.add({ ids, documents: chunks, metadatas });

      return { success: true, eventId, chunksAdded: chunks.length };
    } catch (err) {
      console.error(`[RAG] addEventDocument failed for ${eventId}:`, err);
      throw err;
    }
  }

  async queryEventDocument(
    eventId: string | undefined,
    query: string,
    topK = 5
  ) {
    if (!query?.trim()) {
      throw new Error("query is required");
    }

    try {
      const collection = await chromaClient.getOrCreateCollection({ name: COLLECTION_NAME });
      const whereFilter = eventId ? { eventId } : undefined;

      const result = await collection.query({
        queryTexts: [query],
        nResults: topK,
        where: whereFilter,
        include: ["documents", "distances"] as any,
      });

      const rawDocs = result.documents?.[0] || [];
      const rawDistances = (result as any).distances?.[0] || [];

      const docs = rawDocs.filter((doc, i): doc is string => {
        return typeof doc === "string" && (rawDistances[i] ?? Infinity) <= SIMILARITY_THRESHOLD;
      });

      if (!docs.length) {
        return { answer: [], sourcesUsed: 0 };
      }

      const combinedWords: string[] = [];
      for (const doc of docs) {
        const words = doc.split(/\s+/).filter(Boolean);
        const remaining = CONTEXT_WORD_LIMIT - combinedWords.length;
        if (remaining <= 0) break;
        combinedWords.push(...words.slice(0, remaining));
      }

      const context = combinedWords.join(" ");

      const aiMessage = await llm.invoke([
        {
          role: "system",
          content:
            "You are a helpful event assistant. Answer questions strictly based on the provided context. " +
            "If the context does not contain the answer, say so. Respond only in bullet points.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion:\n${query}`,
        },
      ]);

      let answerText = "";
      if (typeof aiMessage.content === "string") {
        answerText = aiMessage.content;
      } else {
        answerText = aiMessage.content
          .map((v) => ("text" in v ? v.text : ""))
          .join("");
      }

      return {
        answer: answerText
          .split("\n")
          .map((v) => v.trim())
          .filter(Boolean),
        sourcesUsed: docs.length,
      };
    } catch (err) {
      console.error(`[RAG] queryEventDocument failed:`, err);
      throw err;
    }
  }

  async addEventDetail(eventData: any) {
    if (!eventData?._id || !eventData?.title) {
      throw new Error("Invalid event data: _id and title are required");
    }

    try {
      const collection = await chromaClient.getOrCreateCollection({ name: COLLECTION_NAME });
      const content = buildEventContent(eventData);
      const eventId = eventData._id.toString();

      await collection.delete({ where: { eventId } });

      const chunks = splitIntoWordChunksWithOverlap(content, CHUNK_SIZE, CHUNK_OVERLAP);
      const ids = chunks.map((_, i) => `${eventId}_${i}`);
      const metadatas = chunks.map(() => ({ eventId }));

      await collection.add({ ids, documents: chunks, metadatas });

      return { success: true, eventId, chunksAdded: chunks.length };
    } catch (err) {
      console.error(`[RAG] addEventDetail failed for ${eventData?._id}:`, err);
      throw err;
    }
  }
}

eventEmitter.on("eventCreated", async (eventData) => {
  try {
    const service = new RagEventService();
    await service.addEventDetail(eventData);
  } catch (err) {
    console.error("[RAG] eventCreated handler failed:", err);
  }
});
