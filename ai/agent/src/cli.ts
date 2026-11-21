#!/usr/bin/env node
/**
 * CLI for the balldontlie NBA agent.
 *
 *   npm run ask -- "How are the Warriors shooting from three this season?"
 *   npm run ask -- --model haiku "Who plays tonight?"
 *   npm run ask -- --json "Celtics last 5 games"
 *
 * Prints the grounded answer, then a one-line trace of the tools it called and
 * the estimated token cost of the run.
 */
import { runAgent } from "./agent.js";
import { McpBridge } from "./mcpBridge.js";
import { resolveModel } from "./models.js";

interface ParsedArgs {
  question: string;
  model?: string;
  json: boolean;
  maxTurns?: number;
}

function parseArgs(argv: string[]): ParsedArgs {
  const rest: string[] = [];
  let model: string | undefined;
  let json = false;
  let maxTurns: number | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") json = true;
    else if (arg === "--model") model = argv[++i];
    else if (arg.startsWith("--model=")) model = arg.slice("--model=".length);
    else if (arg === "--max-turns") maxTurns = Number(argv[++i]);
    else if (arg.startsWith("--max-turns=")) maxTurns = Number(arg.slice("--max-turns=".length));
    else rest.push(arg);
  }
  return { question: rest.join(" ").trim(), model, json, maxTurns };
}

function fmtUsd(n: number): string {
  if (n < 0.01) return `$${n.toFixed(5)}`;
  return `$${n.toFixed(4)}`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.question) {
    console.error('Usage: npm run ask -- [--model opus|sonnet|haiku] [--json] "<your NBA question>"');
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

  const model = resolveModel(args.model);
  const bridge = new McpBridge();

  try {
    await bridge.connect();
    const result = await runAgent({
      question: args.question,
      bridge,
      model,
      maxTurns: args.maxTurns,
    });

    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(result.answer);
    console.log("");
    const trace =
      result.toolCalls.length > 0
        ? result.toolCalls.map((t) => (t.isError ? `${t.name}✗` : t.name)).join(" → ")
        : "(no tools called)";
    const tok = result.usage;
    console.log(
      `— ${model.label} · ${result.turns} turn(s) · tools: ${trace}\n` +
        `  tokens: ${tok.inputTokens} in / ${tok.outputTokens} out` +
        (tok.cacheReadTokens ? ` / ${tok.cacheReadTokens} cache-read` : "") +
        ` · est. cost ${fmtUsd(result.costUsd)}`,
    );
  } finally {
    await bridge.close();
  }
}

main().catch((error) => {
  console.error("Agent failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
