/**
 * Factuality eval runner (live — needs an Anthropic key and NBA data).
 *
 * Runs each golden case through the agent, then applies deterministic checks:
 *  - grounding: no distinctive figure in the answer is unaccounted for by the
 *    tool results of that run (the core factuality property);
 *  - golden: required stable strings (e.g. a team id) are present;
 *  - refusal: a question the tools cannot answer declines instead of inventing.
 *
 * Prints a per-case report and a summary; exits non-zero if any case fails.
 * Run with: npm run build && npm run eval   (or: npm run eval -- --json)
 */
import { runAgent } from "../src/agent.js";
import { CASES, type EvalCase } from "../src/eval/cases.js";
import { checkGrounding, type SigNumber } from "../src/eval/grounding.js";
import { loadAnthropicEnv } from "../src/loadEnv.js";
import { McpBridge } from "../src/mcpBridge.js";
import { resolveModel } from "../src/models.js";

interface CaseOutcome {
  id: string;
  type: string;
  pass: boolean;
  reasons: string[];
  ungrounded: SigNumber[];
  toolCalls: string[];
  costUsd: number;
}

function fmtNums(ns: SigNumber[]): string {
  return ns.map((n) => n.raw).join(", ");
}

async function runCase(bridge: McpBridge, c: EvalCase): Promise<CaseOutcome> {
  const model = resolveModel(c.model);
  const result = await runAgent({ question: c.question, bridge, model });
  const corpus = result.toolCalls.map((t) => t.resultText).join("\n");
  const grounding = checkGrounding(result.answer, corpus);

  const reasons: string[] = [];

  // Core property for every case: no invented figure.
  if (!grounding.ok) {
    reasons.push(`ungrounded figure(s): ${fmtNums(grounding.ungrounded)}`);
  }

  if (c.type === "grounded") {
    for (const needle of c.mustContain ?? []) {
      if (!result.answer.includes(needle)) reasons.push(`missing required "${needle}"`);
    }
  } else {
    const lower = result.answer.toLowerCase();
    const refused = (c.refusalMarkers ?? []).some((m) => lower.includes(m.toLowerCase()));
    if (!refused) reasons.push("no refusal marker found");
  }

  return {
    id: c.id,
    type: c.type,
    pass: reasons.length === 0,
    reasons,
    ungrounded: grounding.ungrounded,
    toolCalls: result.toolCalls.map((t) => (t.isError ? `${t.name}✗` : t.name)),
    costUsd: result.costUsd,
  };
}

function parseOnly(argv: string[]): Set<string> | null {
  const ids: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--only") ids.push(argv[++i]);
    else if (argv[i].startsWith("--only=")) ids.push(argv[i].slice("--only=".length));
  }
  return ids.length ? new Set(ids) : null;
}

async function main(): Promise<void> {
  loadAnthropicEnv();
  const asJson = process.argv.includes("--json");
  const only = parseOnly(process.argv.slice(2));
  const cases = only ? CASES.filter((c) => only.has(c.id)) : CASES;

  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.error("No Anthropic credentials. Set ANTHROPIC_API_KEY or put it in the project .env.");
    process.exit(1);
  }

  const bridge = new McpBridge();
  const outcomes: CaseOutcome[] = [];
  try {
    await bridge.connect();
    for (const c of cases) {
      const outcome = await runCase(bridge, c);
      outcomes.push(outcome);
      if (!asJson) {
        const tag = outcome.pass ? "PASS" : "FAIL";
        console.error(
          `[${tag}] ${outcome.id} (${outcome.type}) · tools: ${outcome.toolCalls.join(" → ") || "none"}` +
            (outcome.reasons.length ? `\n       ${outcome.reasons.join("; ")}` : ""),
        );
      }
    }
  } finally {
    await bridge.close();
  }

  const passed = outcomes.filter((o) => o.pass).length;
  const totalCost = outcomes.reduce((s, o) => s + o.costUsd, 0);

  if (asJson) {
    console.log(JSON.stringify({ passed, total: outcomes.length, totalCostUsd: totalCost, outcomes }, null, 2));
  } else {
    console.error(
      `\n${passed}/${outcomes.length} cases passed · est. eval cost $${totalCost.toFixed(4)}`,
    );
  }

  process.exit(passed === outcomes.length ? 0 : 1);
}

main().catch((error) => {
  console.error("Eval failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
