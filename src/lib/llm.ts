
import { ChatOpenAI } from "@langchain/openai";


export const llm = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
});
