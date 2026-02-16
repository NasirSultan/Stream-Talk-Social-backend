import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { RagEventService } from "../ragEvent/ragEvent.service";
import { PostRagService } from "../postRag/postRag.service";

const ragEventService = new RagEventService();
const postRagService = new PostRagService();

const eventRagTool = tool(
  async ({ query, eventId, topK }: { query: string; eventId?: string; topK?: number }) => {
    try {
      const result = await ragEventService.queryEventDocument(eventId, query, topK);
      return JSON.stringify({ answer: result.answer, type: "event" });
    } catch (error: any) {
      return JSON.stringify({ answer: [], type: "event" });
    }
  },
  {
    name: "event_rag",
    description: "Search for scheduled activities and time-bound occurrences.",
    schema: z.object({ query: z.string(), eventId: z.string().optional(), topK: z.number().optional().default(5) }),
  }
);

const postRagTool = tool(
  async ({ query, topK }: { query: string; topK?: number }) => {
    try {
      const result = await postRagService.queryPostDocument(query, topK);
      return JSON.stringify({ answer: result.answer, type: "post" });
    } catch (error: any) {
      return JSON.stringify({ answer: [], type: "post" });
    }
  },
  {
    name: "post_rag",
    description: "Search for written content, articles, and educational material.",
    schema: z.object({ query: z.string(), topK: z.number().optional().default(5) }),
  }
);

export class SuperAgentService {
  private model: ChatOpenAI;
  private tools: typeof eventRagTool[];

  constructor() {
    this.model = new ChatOpenAI({ modelName: "gpt-4", temperature: 0 });
    this.tools = [eventRagTool, postRagTool];
    this.model = this.model.bindTools(this.tools);
  }

  private async invokeTool(toolName: string, args: any) {
    console.log(`✅ Invoking tool: ${toolName} with args:`, args);
    const selectedTool = this.tools.find(t => t.name === toolName);
    if (!selectedTool) return { answer: [] };
    const rawResult = await selectedTool.invoke(args);
    try {
      const parsed = JSON.parse(rawResult);
      console.log(`📊 Result from ${toolName}:`, parsed);
      return parsed;
    } catch {
      console.log(`⚠️ Tool ${toolName} returned non-JSON result:`, rawResult);
      return { answer: [] };
    }
  }

async processQuery(query: string): Promise<any> {
  console.log(`🤖 Processing query: "${query}"`);

  const response = await this.model.invoke([
    {
      role: "system",
      content: `You are a semantic routing agent. Decide which tool to use:
- Use event_rag: events, matches, concerts, appointments.
- Use post_rag: articles, blogs, tutorials, documentation.
Call only the matching tool if query is clear.
Call fallback tool if primary tool returns no answer or only non-informative content.`
    },
    { role: "user", content: query }
  ]);

  let primaryToolName = "event_rag";
  if (response.tool_calls && response.tool_calls.length > 0) {
    primaryToolName = response.tool_calls[0].name;
    console.log(`🔧 Primary tool selected by LLM: ${primaryToolName}`);
  } else {
    console.log(`⚠️ No tool selected by LLM, defaulting to event_rag`);
  }

  const primaryResult = await this.invokeTool(primaryToolName, { query });
  let primaryAnswer = Array.isArray(primaryResult.answer) ? primaryResult.answer : [];

  const isNonInformative = primaryAnswer.length === 0 || primaryAnswer.every(a =>
    a.toLowerCase().includes("does not contain any information") ||
    a.toLowerCase().includes("no information") ||
    a.toLowerCase().includes("not found")
  );

  if (isNonInformative) {
    const fallbackToolName = primaryToolName === "event_rag" ? "post_rag" : "event_rag";
    console.log(`⚠️ Primary result non-informative, invoking fallback tool: ${fallbackToolName}`);
    const fallbackResult = await this.invokeTool(fallbackToolName, { query });
    const fallbackAnswer = Array.isArray(fallbackResult.answer) ? fallbackResult.answer : [];
    console.log(`✅ Fallback answer obtained from ${fallbackToolName}`);
    return fallbackAnswer;
  }

  console.log(`✅ Answer obtained from primary tool: ${primaryToolName}`);
  return primaryAnswer;
}

}
