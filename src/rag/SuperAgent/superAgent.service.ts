import {
  HumanMessage,
  SystemMessage,
  AIMessage,
  BaseMessage,
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { InMemoryStore } from "@langchain/langgraph-checkpoint";
// For production swap ↑ with:
// import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres";
import { createDeepAgent, CompositeBackend, StateBackend, StoreBackend } from "deepagents";
import { RagEventService } from "../ragEvent/ragEvent.service";
import { PostRagService } from "../postRag/postRag.service";
import { llm } from "../../lib/llm";

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteType = "event" | "post";

interface RagResult {
  answer: string[];
  type: string;
}

interface RouteDecision {
  primary: RouteType;
  secondary: RouteType;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

interface CacheEntry {
  answers: string[];
  embedding: number[];
  timestamp: number;
  hitCount: number;
}

interface QueryMetrics {
  query: string;
  durationMs: number;
  cacheHit: boolean;
  primaryRoute: RouteType;
  secondaryRoute: RouteType;
  primaryResultCount: number;
  secondaryResultCount: number;
  routeSwapped: boolean;
  synthesized: boolean;
  fallbackUsed: boolean;
  longTermMemoryHit: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NON_INFORMATIVE_PHRASES = [
  "does not contain any information",
  "no information",
  "not found",
  "no results",
  "unable to find",
  "no relevant",
  "cannot find",
  "no data",
] as const;

const MAX_QUERY_LENGTH = 2000;
const MIN_QUERY_LENGTH = 2;
const CACHE_TTL_MS = 1000 * 60 * 10;       // 10-min in-memory TTL
const CACHE_MAX_SIZE = 100;
const SEMANTIC_SIMILARITY_THRESHOLD = 0.92;
const TOOL_RETRY_ATTEMPTS = 2;

// Long-term memory paths (routed to StoreBackend by CompositeBackend)
const LTM_ROUTE_MAP_PATH     = "/memories/adaptive_routes.json";
const LTM_QUERY_HISTORY_PATH = "/memories/query_history.json";
const LTM_KNOWLEDGE_PATH     = "/memories/knowledge_base.json";

// ─── Logger ───────────────────────────────────────────────────────────────────

const logger = {
  info:   (message: string, meta?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: "info",   message, ...meta, ts: new Date().toISOString() })),
  warn:   (message: string, meta?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: "warn",  message, ...meta, ts: new Date().toISOString() })),
  error:  (message: string, meta?: Record<string, unknown>) =>
    console.error(JSON.stringify({ level: "error", message, ...meta, ts: new Date().toISOString() })),
  metric: (metrics: QueryMetrics) =>
    console.log(JSON.stringify({ level: "metric", ...metrics, ts: new Date().toISOString() })),
};

// ─── Validation ───────────────────────────────────────────────────────────────

function validateQuery(query: unknown): string {
  if (typeof query !== "string") throw new Error("Query must be a string.");
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH)
    throw new Error(`Query too short. Minimum ${MIN_QUERY_LENGTH} characters.`);
  if (trimmed.length > MAX_QUERY_LENGTH)
    throw new Error(`Query too long. Maximum ${MAX_QUERY_LENGTH} characters.`);
  return trimmed;
}

function normalizeQuery(query: string): string {
  return query.toLowerCase().replace(/\s+/g, " ").trim();
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function safeParseJSON(raw: string): RagResult | null {
  try { return JSON.parse(raw) as RagResult; }
  catch { return null; }
}

function isNonInformative(answers: string[]): boolean {
  if (answers.length === 0) return true;
  return answers.every((answer) =>
    NON_INFORMATIVE_PHRASES.some((phrase) => answer.toLowerCase().includes(phrase))
  );
}

function deduplicateAnswers(answers: string[]): string[] {
  return [...new Set(answers.map((a) => a.trim()).filter(Boolean))];
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  const dot  = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

// ─── Services ─────────────────────────────────────────────────────────────────

const ragEventService = new RagEventService();
const postRagService  = new PostRagService();

// ─── Shared LangGraph Store ───────────────────────────────────────────────────

/**
 * Development: InMemoryStore (lost on restart)
 * Production : PostgresStore – swap by uncommenting below and setting DATABASE_URL
 *
 *   import { PostgresStore } from "@langchain/langgraph-checkpoint-postgres";
 *   const store = new PostgresStore({ connectionString: process.env.DATABASE_URL });
 */
const store = new InMemoryStore();

// ─── Tools ───────────────────────────────────────────────────────────────────

const eventRagTool = tool(
  async ({ query, eventId, topK }) => {
    for (let attempt = 0; attempt < TOOL_RETRY_ATTEMPTS; attempt++) {
      try {
        const result = await ragEventService.queryEventDocument(eventId, query, topK);
        return JSON.stringify({ answer: result.answer, type: "event" });
      } catch (err) {
        logger.warn("event_rag tool attempt failed", { attempt, error: String(err) });
        if (attempt === TOOL_RETRY_ATTEMPTS - 1) throw err;
      }
    }
    return JSON.stringify({ answer: [], type: "event" });
  },
  {
    name: "event_rag",
    description: "Search for scheduled activities and events.",
    schema: z.object({
      query:   z.string(),
      eventId: z.string().optional(),
      topK:    z.number().optional().default(5),
    }),
  }
);

const postRagTool = tool(
  async ({ query, topK }) => {
    for (let attempt = 0; attempt < TOOL_RETRY_ATTEMPTS; attempt++) {
      try {
        const result = await postRagService.queryPostDocument(query, topK);
        return JSON.stringify({ answer: result.answer, type: "post" });
      } catch (err) {
        logger.warn("post_rag tool attempt failed", { attempt, error: String(err) });
        if (attempt === TOOL_RETRY_ATTEMPTS - 1) throw err;
      }
    }
    return JSON.stringify({ answer: [], type: "post" });
  },
  {
    name: "post_rag",
    description: "Search for written content and posts.",
    schema: z.object({
      query: z.string(),
      topK:  z.number().optional().default(5),
    }),
  }
);

// ─── Tool Executor ────────────────────────────────────────────────────────────

async function executeToolCall(
  ragTool: typeof eventRagTool | typeof postRagTool,
  args:    Record<string, unknown>
): Promise<string[]> {
  logger.info("Invoking tool", { tool: ragTool.name, args });
  try {
    const rawResult = await ragTool.invoke(args as Parameters<typeof ragTool.invoke>[0]);
    const parsed    = safeParseJSON(rawResult as string);
    const answers   = Array.isArray(parsed?.answer) ? parsed.answer : [];
    logger.info("Tool returned", { tool: ragTool.name, count: answers.length });
    return answers;
  } catch (err) {
    logger.error("Tool invocation failed", { tool: ragTool.name, error: String(err) });
    return [];
  }
}

// ─── SubAgents ───────────────────────────────────────────────────────────────

class EventSubAgent {
  async run(query: string, context?: string): Promise<string[]> {
    const enrichedQuery = context ? `${query} | Context: ${context}` : query;
    return executeToolCall(eventRagTool, { query: enrichedQuery });
  }
}

class PostSubAgent {
  async run(query: string, context?: string): Promise<string[]> {
    const enrichedQuery = context ? `${query} | Context: ${context}` : query;
    return executeToolCall(postRagTool, { query: enrichedQuery });
  }
}

// ─── Embedding Client ─────────────────────────────────────────────────────────

async function getEmbedding(text: string): Promise<number[]> {
  const messages: BaseMessage[] = [
    new SystemMessage(
      "Return ONLY a JSON array of 64 floats representing the semantic embedding of the input text. No explanation, no markdown."
    ),
    new HumanMessage(text),
  ];
  try {
    const response = (await llm.invoke(messages)) as AIMessage;
    const cleaned  = (response.content as string).replace(/```json|```/g, "").trim();
    const parsed   = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === "number")) return parsed;
    throw new Error("Invalid embedding shape");
  } catch (err) {
    logger.warn("Embedding generation failed, using fallback", { error: String(err) });
    return [];
  }
}

// ─── Long-Term Memory Manager ─────────────────────────────────────────────────

/**
 * LongTermMemoryManager wraps LangChain Deep Agents' CompositeBackend pattern.
 *
 * Persistent paths (StoreBackend survives restarts and spans threads):
 *   /memories/adaptive_routes.json   – learned preferred route per query key
 *   /memories/query_history.json     – recent successful (query → answers) pairs
 *   /memories/knowledge_base.json    – synthesized knowledge accumulated over time
 *
 * In-memory Maps serve as fast mirrors; every write flushes to the store.
 */
class LongTermMemoryManager {
  private adaptiveRoutes: Map<string, RouteType>            = new Map();
  private queryHistory:   Array<{ query: string; answers: string[]; ts: number }> = [];
  private knowledgeBase:  Map<string, string>               = new Map();

  private agent:    ReturnType<typeof createDeepAgent> | null = null;
  private threadId = "super-agent-global-ltm-thread";

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  async init(): Promise<void> {
    this.agent = createDeepAgent({
      model: llm,
      store,
      backend: (config) =>
        new CompositeBackend(
          new StateBackend(config),                          // ephemeral scratch space
          { "/memories/": new StoreBackend(config) }        // persistent cross-thread layer
        ),
      systemPrompt: `You manage persistent memory files. Always read before writing. Always write valid JSON.
Memory structure:
- ${LTM_ROUTE_MAP_PATH}     : { [queryKey: string]: "event" | "post" }
- ${LTM_QUERY_HISTORY_PATH} : Array<{ query: string; answers: string[]; ts: number }>
- ${LTM_KNOWLEDGE_PATH}     : { [queryKey: string]: string }`,
    });

    await this._loadAll();
    logger.info("LongTermMemoryManager initialised", {
      routes:    this.adaptiveRoutes.size,
      history:   this.queryHistory.length,
      knowledge: this.knowledgeBase.size,
    });
  }

  // ── Internal I/O ──────────────────────────────────────────────────────────

  private async _readFile(path: string): Promise<string | null> {
    if (!this.agent) return null;
    try {
      const result = await this.agent.invoke(
        { messages: [new HumanMessage(`read_file ${path}`)] },
        { configurable: { thread_id: this.threadId } }
      );
      const last    = result.messages[result.messages.length - 1];
      const content = (last as AIMessage).content as string;
      return content?.trim() || null;
    } catch {
      return null;
    }
  }

  private async _writeFile(path: string, content: string): Promise<void> {
    if (!this.agent) return;
    try {
      await this.agent.invoke(
        { messages: [new HumanMessage(`write_file ${path}\n${content}`)] },
        { configurable: { thread_id: this.threadId } }
      );
    } catch (err) {
      logger.warn("LTM write failed", { path, error: String(err) });
    }
  }

  private async _loadAll(): Promise<void> {
    await Promise.all([
      this._loadRoutes(),
      this._loadHistory(),
      this._loadKnowledge(),
    ]);
  }

  private async _loadRoutes(): Promise<void> {
    const raw = await this._readFile(LTM_ROUTE_MAP_PATH);
    if (!raw) return;
    try {
      const obj = JSON.parse(raw) as Record<string, RouteType>;
      this.adaptiveRoutes = new Map(Object.entries(obj));
    } catch { /* first run */ }
  }

  private async _loadHistory(): Promise<void> {
    const raw = await this._readFile(LTM_QUERY_HISTORY_PATH);
    if (!raw) return;
    try { this.queryHistory = JSON.parse(raw); } catch { }
  }

  private async _loadKnowledge(): Promise<void> {
    const raw = await this._readFile(LTM_KNOWLEDGE_PATH);
    if (!raw) return;
    try {
      const obj = JSON.parse(raw) as Record<string, string>;
      this.knowledgeBase = new Map(Object.entries(obj));
    } catch { }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Returns persisted preferred route for this query key, if any. */
  getLearnedRoute(queryKey: string): RouteType | undefined {
    return this.adaptiveRoutes.get(queryKey);
  }

  /** Persists a newly learned route preference across threads. */
  async saveLearnedRoute(queryKey: string, route: RouteType): Promise<void> {
    this.adaptiveRoutes.set(queryKey, route);
    const obj = Object.fromEntries(this.adaptiveRoutes);
    await this._writeFile(LTM_ROUTE_MAP_PATH, JSON.stringify(obj, null, 2));
    logger.info("LTM: saved route", { queryKey, route });
  }

  /** Returns synthesized knowledge stored from a prior session. */
  getKnowledge(queryKey: string): string | undefined {
    return this.knowledgeBase.get(queryKey);
  }

  /** Persists synthesized knowledge for future cross-thread recall. */
  async saveKnowledge(queryKey: string, knowledge: string): Promise<void> {
    this.knowledgeBase.set(queryKey, knowledge);
    const obj = Object.fromEntries(this.knowledgeBase);
    await this._writeFile(LTM_KNOWLEDGE_PATH, JSON.stringify(obj, null, 2));
    logger.info("LTM: saved knowledge", { queryKey, chars: knowledge.length });
  }

  /**
   * Appends a successful query+answer pair to the persistent history.
   * Caps at 500 entries to bound store growth.
   */
  async appendHistory(query: string, answers: string[]): Promise<void> {
    const MAX_HISTORY = 500;
    this.queryHistory.push({ query, answers, ts: Date.now() });
    if (this.queryHistory.length > MAX_HISTORY)
      this.queryHistory = this.queryHistory.slice(-MAX_HISTORY);
    await this._writeFile(
      LTM_QUERY_HISTORY_PATH,
      JSON.stringify(this.queryHistory, null, 2)
    );
  }

  /**
   * Semantic search over the persistent query history.
   * Returns the closest historical answers when similarity exceeds the threshold.
   */
  findHistorySimilar(
    queryEmbedding: number[],
    embeddingIndex: Map<string, number[]>,
    threshold = SEMANTIC_SIMILARITY_THRESHOLD
  ): string[] | null {
    let bestScore   = -1;
    let bestAnswers: string[] | null = null;

    for (const entry of this.queryHistory) {
      const emb = embeddingIndex.get(entry.query);
      if (!emb || emb.length === 0) continue;
      const score = cosineSimilarity(queryEmbedding, emb);
      if (score > bestScore) { bestScore = score; bestAnswers = entry.answers; }
    }

    if (bestScore >= threshold) {
      logger.info("LTM: history semantic hit", { similarity: bestScore.toFixed(4) });
      return bestAnswers;
    }
    return null;
  }
}

// ─── SuperAgentService ────────────────────────────────────────────────────────

export class SuperAgentService {
  private eventSubAgent     = new EventSubAgent();
  private postSubAgent      = new PostSubAgent();
  private ltm               = new LongTermMemoryManager();

  // Short-term in-process caches
  private cache             = new Map<string, CacheEntry>();
  /** Local embedding index for LTM history similarity search */
  private historyEmbeddings = new Map<string, number[]>();

  constructor() {
    // Non-blocking init; queries before completion fall through gracefully
    this.ltm.init().catch((err) =>
      logger.error("LTM init failed", { error: String(err) })
    );
  }

  // ─── Cache Helpers ──────────────────────────────────────────────────────────

  private pruneCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        this.cache.delete(key);
        logger.info("Cache entry expired", { key });
      }
    }
    while (this.cache.size > CACHE_MAX_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (!oldestKey) break;
      this.cache.delete(oldestKey);
      logger.info("Cache evicted LRU entry", { key: oldestKey });
    }
  }

  private touchCacheEntry(key: string): void {
    const entry = this.cache.get(key);
    if (!entry) return;
    this.cache.delete(key);
    this.cache.set(key, { ...entry, hitCount: entry.hitCount + 1 });
  }

  // ─── Short-Term Semantic Cache Lookup ──────────────────────────────────────

  private async findSemanticCacheHit(
    normalizedQuery: string,
    queryEmbedding:  number[]
  ): Promise<{ key: string; entry: CacheEntry } | null> {
    // Fast-path: exact key
    if (this.cache.has(normalizedQuery)) {
      const entry = this.cache.get(normalizedQuery)!;
      if (Date.now() - entry.timestamp <= CACHE_TTL_MS) {
        this.touchCacheEntry(normalizedQuery);
        logger.info("Exact cache hit", { key: normalizedQuery });
        return { key: normalizedQuery, entry };
      }
    }

    // Slow-path: embedding similarity
    if (queryEmbedding.length === 0) return null;
    let bestKey: string | null = null;
    let bestScore = -1;

    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() - entry.timestamp > CACHE_TTL_MS) continue;
      if (entry.embedding.length === 0) continue;
      const score = cosineSimilarity(queryEmbedding, entry.embedding);
      if (score > bestScore) { bestScore = score; bestKey = key; }
    }

    if (bestKey && bestScore >= SEMANTIC_SIMILARITY_THRESHOLD) {
      const entry = this.cache.get(bestKey)!;
      this.touchCacheEntry(bestKey);
      logger.info("Semantic cache hit", { key: bestKey, similarity: bestScore.toFixed(4) });
      return { key: bestKey, entry };
    }
    return null;
  }

  // ─── Routing ─────────────────────────────────────────────────────────────────

  private async route(query: string): Promise<RouteDecision> {
    const systemPrompt = `You are a semantic routing agent. Decide primary and secondary route: event or post.
Respond ONLY with valid JSON (no markdown, no explanation):
{
  "primary": "event" | "post",
  "secondary": "event" | "post",
  "confidence": "high" | "medium" | "low",
  "reasoning": "one sentence explanation"
}`;

    const messages: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      new HumanMessage(query),
    ];

    try {
      const response = (await llm.invoke(messages)) as AIMessage;
      const cleaned  = (response.content as string).replace(/```json|```/g, "").trim();
      const parsed   = JSON.parse(cleaned) as RouteDecision;

      const validRoutes:     RouteType[] = ["event", "post"];
      const validConfidence              = ["high", "medium", "low"];

      if (
        !validRoutes.includes(parsed.primary)     ||
        !validRoutes.includes(parsed.secondary)   ||
        !validConfidence.includes(parsed.confidence)
      ) throw new Error("Invalid route decision schema");

      return parsed;
    } catch (err) {
      logger.warn("Routing failed, using default", { error: String(err) });
      return {
        primary:    "event",
        secondary:  "post",
        confidence: "low",
        reasoning:  "Fallback to default routing due to error.",
      };
    }
  }

  // ─── Sub-agent Dispatch ───────────────────────────────────────────────────────

  private runSubAgent(route: RouteType, query: string, context?: string): Promise<string[]> {
    return route === "event"
      ? this.eventSubAgent.run(query, context)
      : this.postSubAgent.run(query, context);
  }

  // ─── Synthesis ────────────────────────────────────────────────────────────────

  private async synthesizeAnswers(answers: string[], query: string): Promise<string[]> {
    if (answers.length <= 1) return answers;

    const systemPrompt = `You are an AI assistant. Synthesize the following answers into one concise, accurate, non-redundant response for the query: "${query}". Return plain text only.`;
    const messages: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      new HumanMessage(answers.join("\n")),
    ];

    try {
      const response    = (await llm.invoke(messages)) as AIMessage;
      const synthesized = (response.content as string).trim();
      return synthesized ? [synthesized] : answers;
    } catch (err) {
      logger.warn("Synthesis failed, returning raw answers", { error: String(err) });
      return answers;
    }
  }

  // ─── Main Entry Point ─────────────────────────────────────────────────────────

  async processQuery(query: unknown): Promise<string[]> {
    const start   = Date.now();
    const metrics: Partial<QueryMetrics> = { longTermMemoryHit: false };

    // 1. Validate + normalise
    const validatedQuery  = validateQuery(query);
    const normalizedQuery = normalizeQuery(validatedQuery);
    metrics.query = normalizedQuery;

    this.pruneCache();

    // 2. Embed the query (shared by both cache tiers)
    const queryEmbedding = await getEmbedding(normalizedQuery);

    // ── 3a. Short-term in-memory semantic cache ────────────────────────────────
    const cacheHit = await this.findSemanticCacheHit(normalizedQuery, queryEmbedding);
    if (cacheHit) {
      metrics.cacheHit   = true;
      metrics.durationMs = Date.now() - start;
      logger.metric({ ...(metrics as QueryMetrics) });
      return cacheHit.entry.answers;
    }
    metrics.cacheHit = false;

    // ── 3b. Long-term knowledge base (exact key, cross-thread) ─────────────────
    const ltmKnowledge = this.ltm.getKnowledge(normalizedQuery);
    if (ltmKnowledge) {
      logger.info("LTM: knowledge base hit", { query: normalizedQuery });
      metrics.longTermMemoryHit = true;
      metrics.durationMs = Date.now() - start;
      logger.metric({ ...(metrics as QueryMetrics) });
      // Warm the short-term cache with the LTM answer so next call is instant
      this.cache.set(normalizedQuery, {
        answers:   [ltmKnowledge],
        embedding: queryEmbedding,
        timestamp: Date.now(),
        hitCount:  0,
      });
      return [ltmKnowledge];
    }

    // ── 3c. Long-term query-history semantic search ────────────────────────────
    const historyHit = this.ltm.findHistorySimilar(
      queryEmbedding,
      this.historyEmbeddings
    );
    if (historyHit) {
      logger.info("LTM: history semantic hit", { query: normalizedQuery });
      metrics.longTermMemoryHit = true;
      metrics.durationMs = Date.now() - start;
      logger.metric({ ...(metrics as QueryMetrics) });
      this.cache.set(normalizedQuery, {
        answers:   historyHit,
        embedding: queryEmbedding,
        timestamp: Date.now(),
        hitCount:  0,
      });
      return historyHit;
    }

    // 4. LLM routing (prefer LTM-persisted adaptive route when available)
    let decision = await this.route(normalizedQuery);

    const ltmRoute = this.ltm.getLearnedRoute(normalizedQuery);
    if (ltmRoute) {
      logger.info("LTM: adaptive route override", { primary: ltmRoute });
      decision = {
        ...decision,
        primary:   ltmRoute,
        secondary: ltmRoute === "event" ? "post" : "event",
      };
    }

    metrics.primaryRoute   = decision.primary;
    metrics.secondaryRoute = decision.secondary;
    metrics.routeSwapped   = false;
    metrics.fallbackUsed   = false;
    metrics.synthesized    = false;

    logger.info("Routing decision", {
      primary:    decision.primary,
      secondary:  decision.secondary,
      confidence: decision.confidence,
      reasoning:  decision.reasoning,
    });

    // 5. Execute primary + secondary sub-agents in parallel
    const [primaryResults, secondaryResults] = await Promise.all([
      this.runSubAgent(decision.primary,   normalizedQuery, decision.reasoning),
      this.runSubAgent(decision.secondary, normalizedQuery, decision.reasoning),
    ]);

    metrics.primaryResultCount   = primaryResults.length;
    metrics.secondaryResultCount = secondaryResults.length;

    logger.info("Sub-agent results", {
      primaryCount:   primaryResults.length,
      secondaryCount: secondaryResults.length,
    });

    // 6. Adaptive route learning → persist to LTM if secondary wins
    const primaryScore   = isNonInformative(primaryResults)   ? 0 : primaryResults.length;
    const secondaryScore = isNonInformative(secondaryResults) ? 0 : secondaryResults.length;

    if (secondaryScore > primaryScore) {
      logger.info("Adaptive feedback: secondary outperformed primary – swapping & persisting to LTM");
      [decision.primary, decision.secondary] = [decision.secondary, decision.primary];
      metrics.routeSwapped = true;
      // Fire-and-forget; we do not await to keep the hot path fast
      void this.ltm.saveLearnedRoute(normalizedQuery, decision.primary);
    }

    // 7. Combine + deduplicate results
    let combinedResults: string[] = [];
    if (!isNonInformative(primaryResults))   combinedResults.push(...primaryResults);
    if (!isNonInformative(secondaryResults)) combinedResults.push(...secondaryResults);
    combinedResults = deduplicateAnswers(combinedResults);

    // 8. Fallback: exhaustive parallel search when results are empty
    if (combinedResults.length === 0 && decision.confidence !== "high") {
      logger.info("No results – running fallback parallel exhaustive search");
      metrics.fallbackUsed = true;
      const [eventResults, postResults] = await Promise.all([
        this.eventSubAgent.run(normalizedQuery),
        this.postSubAgent.run(normalizedQuery),
      ]);
      combinedResults = deduplicateAnswers([...eventResults, ...postResults]);
      logger.info("Fallback results", { count: combinedResults.length });
    }

    // 9. Synthesis
    let finalAnswers: string[];
    if (combinedResults.length > 1) {
      metrics.synthesized = true;
      finalAnswers = await this.synthesizeAnswers(combinedResults, normalizedQuery);
    } else {
      finalAnswers = combinedResults;
    }

    logger.info("Final answers", { count: finalAnswers.length });

    // 10. Persist to long-term memory (fire-and-forget for performance)
    if (finalAnswers.length > 0) {
      // Persist synthesized knowledge for future exact + cross-thread hits
      void this.ltm.saveKnowledge(normalizedQuery, finalAnswers.join("\n"));
      // Append to query history for future semantic-similarity recall
      void this.ltm.appendHistory(normalizedQuery, finalAnswers);
      // Index the embedding locally so history search works this session
      if (queryEmbedding.length > 0) {
        this.historyEmbeddings.set(normalizedQuery, queryEmbedding);
      }
    }

    // 11. Warm short-term cache
    this.cache.set(normalizedQuery, {
      answers:   finalAnswers,
      embedding: queryEmbedding,
      timestamp: Date.now(),
      hitCount:  0,
    });

    metrics.durationMs = Date.now() - start;
    logger.metric({ ...(metrics as QueryMetrics) });

    return finalAnswers;
  }
}