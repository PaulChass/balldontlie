/**
 * Offline check for the agent loop itself, with a stubbed Anthropic client.
 *
 * Proves the orchestration — tool_use detection, real MCP tool execution,
 * message threading, usage accounting, and final-answer extraction — without an
 * API key. The stub stands in for the model: turn 1 it calls resolve_team, turn
 * 2 it answers. The only thing NOT exercised here is the real network call to
 * Anthropic, which is standard SDK usage.
 *
 * Run with: npm run loop-check
 */
import { strict as assert } from "node:assert";
import type Anthropic from "@anthropic-ai/sdk";
import { runAgent } from "../src/agent.js";
import { McpBridge } from "../src/mcpBridge.js";
import { resolveModel } from "../src/models.js";

let turn = 0;

// A minimal stand-in for the Anthropic client: only messages.create is used.
const stubClient = {
  messages: {
    create: async (_req: unknown) => {
      turn++;
      if (turn === 1) {
        return {
          stop_reason: "tool_use",
          usage: { input_tokens: 100, output_tokens: 20 },
          content: [
            { type: "text", text: "Let me look up the team id." },
            { type: "tool_use", id: "t1", name: "resolve_team", input: { query: "Warriors", response_format: "json" } },
          ],
        };
      }
      return {
        stop_reason: "end_turn",
        usage: { input_tokens: 120, output_tokens: 30 },
        content: [{ type: "text", text: "Golden State's team id is 1610612744." }],
      };
    },
  },
} as unknown as Anthropic;

const bridge = new McpBridge();
try {
  await bridge.connect();
  const result = await runAgent({
    question: "What is the Warriors' team id?",
    bridge,
    model: resolveModel("opus"),
    client: stubClient,
  });

  assert.equal(result.turns, 2, "should take two turns");
  assert.ok(result.answer.includes("1610612744"), "final answer should be returned");
  assert.equal(result.toolCalls.length, 1, "one tool call");
  assert.equal(result.toolCalls[0].name, "resolve_team", "resolve_team was called");
  assert.equal(result.toolCalls[0].isError, false, "tool call succeeded");
  assert.equal(result.usage.inputTokens, 220, "input tokens summed across turns");
  assert.equal(result.usage.outputTokens, 50, "output tokens summed across turns");
  assert.ok(result.costUsd > 0, "cost estimated");
  assert.equal(result.stopReason, "end_turn", "final stop reason");

  console.error(`✓ loop: ${result.turns} turns, tool ${result.toolCalls[0].name}, est. cost $${result.costUsd.toFixed(6)}`);
  console.error("Loop check passed.");
} finally {
  await bridge.close();
}
