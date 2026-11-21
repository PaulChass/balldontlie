/**
 * Usage B CLI — grounded previews of tonight's games, factuality-checked and
 * editorially judged.
 *
 *   npm run preview                 # 1 preview for today's slate (+ judge)
 *   npm run preview -- --all        # every game on the slate
 *   npm run preview -- --limit 2 --day 1   # 2 games for tomorrow
 *   npm run preview -- --no-judge --json
 *
 * Previews are inherently multi-step, so they run on Opus by default
 * (--model to override); the judge runs on Sonnet.
 */
import { judgePreview } from "../src/preview/judge.js";
import { generatePreview, getSlate, type GameRef } from "../src/preview/preview.js";
import { loadAnthropicEnv } from "../src/loadEnv.js";
import { McpBridge } from "../src/mcpBridge.js";
import { resolveModel } from "../src/models.js";

function arg(name: string, argv: string[]): string | undefined {
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && i + 1 < argv.length) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(name.length + 3) : undefined;
}

function fmtUsd(n: number): string {
  return n < 0.01 ? `$${n.toFixed(5)}` : `$${n.toFixed(4)}`;
}

async function main(): Promise<void> {
  loadAnthropicEnv();
  const argv = process.argv.slice(2);
  const asJson = argv.includes("--json");
  const all = argv.includes("--all");
  const noJudge = argv.includes("--no-judge");
  const limit = all ? Infinity : Number(arg("limit", argv) ?? "1");
  const dayOffset = Number(arg("day", argv) ?? "0");
  const model = resolveModel(arg("model", argv) ?? "opus");

  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.error("No Anthropic credentials. Set ANTHROPIC_API_KEY or put it in the project .env.");
    process.exit(1);
  }

  const bridge = new McpBridge();
  const results: unknown[] = [];
  let totalCost = 0;
  let passed = 0;
  let count = 0;

  try {
    await bridge.connect();
    const slate: GameRef[] = await getSlate(bridge, dayOffset);
    if (slate.length === 0) {
      console.error(`No games on the slate for day_offset=${dayOffset}.`);
      process.exit(0);
    }
    const games = slate.slice(0, Math.min(limit, slate.length));

    for (const game of games) {
      count++;
      const preview = await generatePreview(bridge, game, model);
      const judge = noJudge ? null : await judgePreview(preview.briefing, {});
      const cost = preview.agent.costUsd + (judge?.costUsd ?? 0);
      totalCost += cost;
      const factual = preview.grounding.ok;
      const quality = judge ? judge.verdict.pass : true;
      if (factual && quality) passed++;

      if (asJson) {
        results.push({
          title: preview.title,
          grounded: factual,
          ungrounded: preview.grounding.ungrounded.map((n) => n.raw),
          judge: judge?.verdict ?? null,
          costUsd: cost,
          briefing: preview.briefing,
        });
        continue;
      }

      console.log("\n" + "═".repeat(72));
      console.log(preview.briefing);
      console.log("─".repeat(72));
      const derivedN = preview.grounding.derived.length;
      const g = factual
        ? `grounding ✓ (${preview.grounding.grounded.length} literal` +
          (derivedN ? `, ${derivedN} derived differential(s)` : "") +
          " — all trace to tool data)"
        : `grounding ✗ ungrounded: ${preview.grounding.ungrounded.map((n) => n.raw).join(", ")}`;
      console.log(g);
      if (judge) {
        const v = judge.verdict;
        console.log(
          `judge (${judge.model.label}): overall ${v.overall}/5 ` +
            `[clarity ${v.scores.clarity} · insight ${v.scores.insight} · useful ${v.scores.usefulness} · structure ${v.scores.structure} · tone ${v.scores.tone}] ` +
            `· incitation=${v.gamblingIncitement ? "OUI ✗" : "non"} · ${v.pass ? "PASS" : "FAIL"}`,
        );
        if (v.rationale) console.log(`  “${v.rationale}”`);
      }
      console.log(
        `tools: ${preview.agent.toolCalls.map((t) => (t.isError ? `${t.name}✗` : t.name)).join(" → ")} · cost ${fmtUsd(cost)}`,
      );
    }
  } finally {
    await bridge.close();
  }

  if (asJson) {
    console.log(JSON.stringify({ passed, total: count, totalCostUsd: totalCost, results }, null, 2));
  } else {
    console.log("\n" + "═".repeat(72));
    console.log(`${passed}/${count} previews passed (grounded + quality) · est. cost ${fmtUsd(totalCost)}`);
  }
  process.exit(passed === count ? 0 : 1);
}

main().catch((error) => {
  console.error("Preview failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
