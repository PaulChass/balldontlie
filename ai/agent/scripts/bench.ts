/**
 * Cost/latency benchmark for the routing pillar (live — needs a key).
 *
 * Runs a representative mix of questions through the router + agent, sharing one
 * bridge so the tool cache carries across questions. Prints a per-question table
 * and totals, including what the same runs would have cost on all-Opus — the
 * measured payoff of routing to the cheapest capable model.
 *
 * Run with: npm run bench   (or: npm run bench -- --json)
 */
import { runAgent } from "../src/agent.js";
import { loadAnthropicEnv } from "../src/loadEnv.js";
import { McpBridge } from "../src/mcpBridge.js";
import { estimateCostUsd, MODELS, resolveModel } from "../src/models.js";
import { route } from "../src/router.js";

const QUESTIONS = [
  "Quels matchs NBA se jouent ce soir ?",
  "Quel est le bilan et le net rating des Golden State Warriors cette saison ?",
  "Quels joueurs sont blessés chez les Warriors ?",
  "Compare la forme récente des Celtics et des Warriors.",
  "Quels ont été les résultats d'hier soir ?",
];

interface Row {
  q: string;
  tier: string;
  model: string;
  tools: number;
  turns: number;
  inTok: number;
  outTok: number;
  costUsd: number;
  opusUsd: number;
  ms: number;
}

async function main(): Promise<void> {
  loadAnthropicEnv();
  const asJson = process.argv.includes("--json");
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.error("No Anthropic credentials. Set ANTHROPIC_API_KEY or put it in the project .env.");
    process.exit(1);
  }

  const bridge = new McpBridge(); // cache on (default 60s)
  const rows: Row[] = [];
  try {
    await bridge.connect();
    for (const q of QUESTIONS) {
      const decision = route(q);
      const model = resolveModel(decision.model);
      const started = Date.now();
      const r = await runAgent({ question: q, bridge, model });
      rows.push({
        q,
        tier: decision.tier,
        model: model.label,
        tools: r.toolCalls.length,
        turns: r.turns,
        inTok: r.usage.inputTokens,
        outTok: r.usage.outputTokens,
        costUsd: r.costUsd,
        opusUsd: estimateCostUsd(r.usage, MODELS.opus.pricing),
        ms: Date.now() - started,
      });
    }
  } finally {
    await bridge.close();
  }

  const cache = bridge.getCacheStats();
  const totalCost = rows.reduce((s, r) => s + r.costUsd, 0);
  const totalOpus = rows.reduce((s, r) => s + r.opusUsd, 0);
  const totalMs = rows.reduce((s, r) => s + r.ms, 0);
  const saved = totalOpus > 0 ? Math.round((1 - totalCost / totalOpus) * 100) : 0;

  if (asJson) {
    console.log(JSON.stringify({ rows, totals: { totalCost, totalOpus, savedPct: saved, totalMs, cache } }, null, 2));
    return;
  }

  console.error("\nRouting benchmark\n");
  console.error("tier      model        tools turns   in/out tok     cost      (all-Opus)   latency  question");
  console.error("─".repeat(108));
  for (const r of rows) {
    console.error(
      `${r.tier.padEnd(9)} ${r.model.padEnd(11)} ${String(r.tools).padStart(3)}  ${String(r.turns).padStart(4)}  ` +
        `${`${r.inTok}/${r.outTok}`.padStart(13)}  ${("$" + r.costUsd.toFixed(5)).padStart(9)}  ` +
        `${("$" + r.opusUsd.toFixed(5)).padStart(10)}   ${(r.ms / 1000).toFixed(1).padStart(5)}s  ${r.q}`,
    );
  }
  console.error("─".repeat(108));
  console.error(
    `Total: routed $${totalCost.toFixed(4)} vs all-Opus $${totalOpus.toFixed(4)} → saved ${saved}% · ` +
      `${(totalMs / 1000).toFixed(1)}s · tool-cache ${cache.hits} hit / ${cache.misses} miss`,
  );
}

main().catch((error) => {
  console.error("Bench failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
