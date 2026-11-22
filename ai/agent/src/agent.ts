/**
 * The agent loop: answer a natural-language NBA question by calling the MCP
 * tools and grounding every number in a tool result.
 *
 * This is a deliberately explicit `while (stop_reason === "tool_use")` loop
 * rather than the SDK's beta tool runner — the orchestration is the point, and
 * it keeps the factuality contract (below) visible and testable.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { McpBridge } from "./mcpBridge.js";
import { addUsage, emptyUsage, estimateCostUsd, type ModelSpec, type UsageTotals } from "./models.js";

/**
 * The factuality contract. Pillar 3 of the project lives here: the model may
 * only report numbers that come back from a tool, and must say so when the
 * tools cannot answer — no invented stats, no memory, no guessing.
 */
const SYSTEM_PROMPT = `You are a grounded NBA statistics analyst for balldontlie. You answer questions about the NBA using ONLY live data returned by your tools.

Hard rules:
- Every factual figure — a stat, score, record, standing, date, tip-off time, or injury — MUST come from a tool result in THIS conversation. Never state a number from memory, and never estimate or guess one.
- If the tools do not return what is needed, or a tool errors, say so plainly and stop. Do not fill the gap with your own knowledge.
- To go from a team or player name to an id, call resolve_team / resolve_player first, then pass the id to the stats tools.
- The data defaults to the current season (2026-27). Only pass a season parameter when the user explicitly asks about a different season.

How to answer:
- Plan the tool calls, run them, then answer from what came back. Prefer one well-parameterised call over many.
- Be concise and analytical. Name the figures you used (team, player, season, stat) so the answer is traceable.
- For any betting or odds angle, stay strictly descriptive — report what the numbers say, never encourage, advise, or predict a bet.
- Reply in the same language as the question.`;

export interface ToolCallTrace {
  name: string;
  input: Record<string, unknown>;
  isError: boolean;
  /** The tool's result text — the grounding corpus for factuality checks. */
  resultText: string;
}

export interface AgentResult {
  answer: string;
  model: ModelSpec;
  usage: UsageTotals;
  costUsd: number;
  toolCalls: ToolCallTrace[];
  turns: number;
  stopReason: string | null;
}

export interface RunOptions {
  question: string;
  bridge: McpBridge;
  model: ModelSpec;
  client?: Anthropic;
  /** Safety cap on agent turns, to bound cost on a runaway loop. */
  maxTurns?: number;
  /** Per-request output-token cap. */
  maxTokens?: number;
  /** Override the system prompt (e.g. the preview briefing prompt). */
  systemPrompt?: string;
  /** Thinking/compute effort. Lower = fewer thinking tokens (billed as output). */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
}

type EphemeralCacheable = { cache_control?: { type: "ephemeral" } };

/**
 * Prompt caching for the agentic loop. The stable prefix (tool schemas + system
 * prompt) is cached once; a single rolling breakpoint on the latest message then
 * lets every turn re-read the accumulated history from cache (~0.1x input price)
 * instead of re-billing it in full. Breakpoints used: tools + system + rolling = 3
 * (the API allows 4). Caching is transparent — it changes cost, never the output.
 */
function applyRollingCache(messages: Anthropic.MessageParam[]): void {
  // Drop any breakpoint we set on a previous turn, keep only the latest.
  for (const message of messages) {
    if (!Array.isArray(message.content)) continue;
    for (const block of message.content) {
      delete (block as EphemeralCacheable).cache_control;
    }
  }
  const last = messages[messages.length - 1];
  if (last && Array.isArray(last.content) && last.content.length > 0) {
    (last.content[last.content.length - 1] as EphemeralCacheable).cache_control = {
      type: "ephemeral",
    };
  }
}

export async function runAgent(opts: RunOptions): Promise<AgentResult> {
  const client = opts.client ?? new Anthropic();
  const maxTurns = opts.maxTurns ?? 12;
  const maxTokens = opts.maxTokens ?? 16000;

  const systemPrompt = opts.systemPrompt ?? SYSTEM_PROMPT;
  // Cache the stable prefix: the system prompt and the (deterministic) tool list.
  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
  ];
  const baseTools = await opts.bridge.listAnthropicTools();
  const tools: Anthropic.Tool[] = baseTools.map((tool, i) =>
    i === baseTools.length - 1 ? { ...tool, cache_control: { type: "ephemeral" } } : tool,
  );
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: [{ type: "text", text: opts.question }] },
  ];
  const usage = emptyUsage();
  const toolCalls: ToolCallTrace[] = [];

  let answer = "";
  let stopReason: string | null = null;
  let turns = 0;

  while (turns < maxTurns) {
    turns++;
    applyRollingCache(messages);
    const response = await client.messages.create({
      model: opts.model.id,
      max_tokens: maxTokens,
      thinking: { type: "adaptive" },
      ...(opts.effort ? { output_config: { effort: opts.effort } } : {}),
      system,
      tools,
      messages,
    });
    addUsage(usage, response.usage);
    stopReason = response.stop_reason;
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "refusal") {
      answer = "The request was declined by the model's safety system.";
      break;
    }

    if (response.stop_reason !== "tool_use") {
      answer = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      break;
    }

    // Execute every tool_use block, then return all results in one user message.
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const input = (block.input ?? {}) as Record<string, unknown>;
      const { text, isError } = await opts.bridge.callTool(block.name, input);
      toolCalls.push({ name: block.name, input, isError, resultText: text });
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: [{ type: "text", text: text || "(no content)" }],
        is_error: isError,
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  if (!answer && turns >= maxTurns) {
    answer = `Stopped after ${maxTurns} turns without a final answer.`;
  }

  return {
    answer,
    model: opts.model,
    usage,
    costUsd: estimateCostUsd(usage, opts.model.pricing),
    toolCalls,
    turns,
    stopReason,
  };
}

export { SYSTEM_PROMPT };
