#!/usr/bin/env node
/**
 * CLI for the balldontlie NBA agent.
 *
 *   npm run ask -- "Compare les Celtics et les Warriors cette saison"
 *   npm run ask -- --model haiku "Qui joue ce soir ?"
 *   npm run ask -- --no-cache --json "Celtics last 5 games"
 *
 * By default the model is chosen automatically by the complexity router
 * (--model <opus|sonnet|haiku> forces one). Prints the grounded answer, then a
 * trace with the model used, latency, token cost, the cost the same run would
 * have had on all-Opus, and tool-cache hits.
 */
import { runAgent } from "./agent.js";
import { loadAnthropicEnv } from "./loadEnv.js";
import { McpBridge } from "./mcpBridge.js";
import { estimateCostUsd, MODELS, resolveModel } from "./models.js";
import { route } from "./router.js";

interface ParsedArgs {
  question: string;
  model?: string;
  json: boolean;
  noCache: boolean;
  maxTurns?: number;
}

function parseArgs(argv: string[]): ParsedArgs {
  const rest: string[] = [];
  let model: string | undefined;
  let json = false;
  let noCache = false;
  let maxTurns: number | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") json = true;
    else if (arg === "--no-cache") noCache = true;
    else if (arg === "--model") model = argv[++i];
    else if (arg.startsWith("--model=")) model = arg.slice("--model=".length);
    else if (arg === "--max-turns") maxTurns = Number(argv[++i]);
    else if (arg.startsWith("--max-turns=")) maxTurns = Number(arg.slice("--max-turns=".length));
    else rest.push(arg);
  }
  return { question: rest.join(" ").trim(), model, json, noCache, maxTurns };
}

function fmtUsd(n: number): string {
  return n < 0.01 ? `$${n.toFixed(5)}` : `$${n.toFixed(4)}`;
}

async function main(): Promise<void> {
  loadAnthropicEnv(); // pick up ANTHROPIC_* from the project .env if not already set
  const args = parseArgs(process.argv.slice(2));

  if (!args.question) {
    console.error('Usage: npm run ask -- [--model opus|sonnet|haiku] [--no-cache] [--json] "<your NBA question>"');
    process.exit(2);
  }

  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.error(
      "No Anthropic credentials found.\n" +
        "Set ANTHROPIC_API_KEY (e.g. `export ANTHROPIC_API_KEY=sk-ant-...`) or sign in with `ant auth login`,\n" +
        "then re-run. The MCP tool layer works without a key — only the agent's model calls need one.",
    );
    process.exit(1);
  }

  const forced = args.model && args.model.toLowerCase() !== "auto";
  const decision = forced ? null : route(args.question);
  const model = forced ? resolveModel(args.model) : resolveModel(decision!.model);

  const bridge = new McpBridge(args.noCache ? { cacheTtlMs: 0 } : {});

  try {
    await bridge.connect();
    const started = Date.now();
    const result = await runAgent({
      question: args.question,
      bridge,
      model,
      maxTurns: args.maxTurns,
    });
    const elapsedMs = Date.now() - started;
    const cache = bridge.getCacheStats();

    if (args.json) {
      console.log(
        JSON.stringify(
          {
            ...result,
            routing: decision,
            elapsedMs,
            cache,
            allOpusCostUsd: estimateCostUsd(result.usage, MODELS.opus.pricing),
          },
          null,
          2,
        ),
      );
      return;
    }

    console.log(result.answer);
    console.log("");

    const trace =
      result.toolCalls.length > 0
        ? result.toolCalls.map((t) => (t.isError ? `${t.name}✗` : t.name)).join(" → ")
        : "(no tools called)";
    const tok = result.usage;
    const opusCost = estimateCostUsd(result.usage, MODELS.opus.pricing);
    const saved = opusCost > 0 ? Math.round((1 - result.costUsd / opusCost) * 100) : 0;
    const how = decision ? `routed → ${model.label} (${decision.reasons.join(", ")})` : `${model.label} (forced)`;

    console.log(
      `— ${how} · ${result.turns} turn(s) · ${(elapsedMs / 1000).toFixed(1)}s · tools: ${trace}\n` +
        `  tokens: ${tok.inputTokens} in / ${tok.outputTokens} out` +
        (tok.cacheReadTokens ? ` / ${tok.cacheReadTokens} prompt-cache` : "") +
        ` · est. cost ${fmtUsd(result.costUsd)}` +
        (saved > 0 ? ` · all-Opus ${fmtUsd(opusCost)} → saved ${saved}%` : "") +
        `\n  tool-cache: ${cache.hits} hit / ${cache.misses} miss`,
    );
  } finally {
    await bridge.close();
  }
}

main().catch((error) => {
  console.error("Agent failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
