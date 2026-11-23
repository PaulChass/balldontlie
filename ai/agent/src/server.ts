/**
 * Local HTTP service wrapping the NBA agent — the backend of the web surface.
 *
 * It exposes two things over HTTP on 127.0.0.1 so the Symfony site can proxy to
 * them: the grounded Q&A agent (usage A) and the auto game previews (usage B).
 * The Anthropic API key stays in THIS process's environment and never reaches
 * the browser — the browser only ever talks to Symfony, which talks to here.
 *
 *   npm run build && npm run serve   # runs dist/server.js on 127.0.0.1:8787
 *   npm run serve:dev                # same, via tsx, no build step
 *
 * Endpoints (all JSON):
 *   GET  /health                     -> { ok, tools, credentials }
 *   POST /ask     { question, match? }  -> grounded answer + routing + cost + grounding
 *   GET  /previews?day=0&limit=2     -> grounded briefings for the slate (cached)
 *   GET  /match-preview?home_team_id&away_team_id -> on-demand debrief for one match (cached)
 *
 * Design notes:
 *   - One shared MCP bridge, connected once and reused (the MCP server is a
 *     child process over stdio; keeping it warm avoids a spawn per request).
 *   - Agent runs are serialised, so a burst of visitors can't fan out into
 *     parallel model calls and blow the API budget. Low-traffic site; this is
 *     the safe default.
 *   - Previews are expensive (multi-step, Opus) so they are cached in-process;
 *     Symfony caches them a second time, so this is hit at most once per TTL.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { runAgent, SYSTEM_PROMPT } from "./agent.js";
import { checkGrounding } from "./eval/grounding.js";
import { loadAnthropicEnv } from "./loadEnv.js";
import { McpBridge } from "./mcpBridge.js";
import { estimateCostUsd, MODELS, resolveModel } from "./models.js";
import { route } from "./router.js";
import { generateMatchupPreview, generatePreview, getSlate, type GameRef } from "./preview/preview.js";

const HOST = "127.0.0.1";
const PORT = Number(process.env.NBA_AGENT_PORT ?? process.env.PORT ?? 8787);

const MAX_BODY_BYTES = 64 * 1024; // reject oversized request bodies
const QUESTION_MIN = 3;
const QUESTION_MAX = 500;
const ASK_MAX_TURNS = 10; // bound a runaway agent loop

const PREVIEW_CACHE_TTL_MS = 60 * 60 * 1000; // 1h: pre-game data moves slowly
const PREVIEW_DEFAULT_LIMIT = 2;
const PREVIEW_MAX_LIMIT = 6;

// Model + effort for the auto previews — the single place to tune preview cost.
// Sonnet at medium effort: judged against the LLM judge on a 3-game sample it
// matched the factuality contract (3/3 fully grounded, vs 2/3 for Opus) at a
// PASS editorial grade (3/5 vs Opus 4/5) for ~57% less than cached Opus
// (~$0.015 vs ~$0.036 per preview). Re-measure before changing:
//   npm run preview -- --model sonnet --effort medium --all
const PREVIEW_MODEL = MODELS.sonnet;
const PREVIEW_EFFORT: "low" | "medium" | "high" | "xhigh" | "max" | undefined = "medium";

let bridge: McpBridge;

function hasCredentials(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/** Serialise agent runs: one model-driven request at a time, in arrival order. */
let queueTail: Promise<unknown> = Promise.resolve();
function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const result = queueTail.then(fn, fn);
  queueTail = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(payload);
}

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) return resolve({});
      try {
        const parsed = JSON.parse(raw);
        resolve(parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {});
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

type Effort = "low" | "medium" | "high" | "xhigh" | "max";

// « Qualité IA » : quand un utilisateur connecté privilégie la qualité au coût,
// on monte le modèle choisi par le routeur d'un cran et on augmente l'effort.
// Le mode par défaut (préférence absente) reste économique (routeur + cache).
const QUALITY_UPGRADE: Record<string, keyof typeof MODELS> = {
  haiku: "sonnet",
  sonnet: "opus",
  opus: "opus",
};
const QUALITY_EFFORT: Effort = "high";

// ─── match context (chat scopé à un match du Face-à-Face) ────────────────────

interface MatchContext {
  homeTeamId: number;
  awayTeamId: number;
  homeName: string;
  awayName: string;
}

/** Parse an optional { home_team_id, away_team_id, home_name, away_name } blob. */
function parseMatch(raw: unknown): MatchContext | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  const homeTeamId = Number(m.home_team_id);
  const awayTeamId = Number(m.away_team_id);
  if (!Number.isFinite(homeTeamId) || !Number.isFinite(awayTeamId) || homeTeamId <= 0 || awayTeamId <= 0) {
    return null;
  }
  const homeName = typeof m.home_name === "string" ? m.home_name.trim().slice(0, 60) : "";
  const awayName = typeof m.away_name === "string" ? m.away_name.trim().slice(0, 60) : "";
  return {
    homeTeamId,
    awayTeamId,
    homeName: homeName || `équipe ${homeTeamId}`,
    awayName: awayName || `équipe ${awayTeamId}`,
  };
}

/** Scope the agent to a match: same factuality contract + a match context block. */
function buildMatchSystem(m: MatchContext): string {
  return (
    `${SYSTEM_PROMPT}\n\n` +
    `Contexte du match : l'utilisateur consulte la page de ${m.awayName} @ ${m.homeName} ` +
    `(home_team_id=${m.homeTeamId}, away_team_id=${m.awayTeamId}). Sauf s'il mentionne ` +
    `explicitement un autre sujet, suppose que sa question porte sur ce match, ces deux ` +
    `équipes ou leurs joueurs. Tu peux utiliser ces team ids directement avec les outils.`
  );
}

// ─── /ask ──────────────────────────────────────────────────────────────────

async function handleAsk(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!hasCredentials()) {
    sendJson(res, 503, { error: "no_credentials", message: "The agent service has no Anthropic API key configured." });
    return;
  }

  let body: Record<string, unknown>;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { error: "bad_request", message: error instanceof Error ? error.message : "bad body" });
    return;
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (question.length < QUESTION_MIN) {
    sendJson(res, 400, { error: "question_too_short", message: `La question doit faire au moins ${QUESTION_MIN} caractères.` });
    return;
  }
  if (question.length > QUESTION_MAX) {
    sendJson(res, 400, { error: "question_too_long", message: `La question est limitée à ${QUESTION_MAX} caractères.` });
    return;
  }

  const forced = typeof body.model === "string" && body.model.toLowerCase() !== "auto";
  const decision = forced ? null : route(question);
  const preferQuality = body.prefer_quality === true;
  // Chat scopé à un match : contexte optionnel injecté dans le system prompt.
  const match = parseMatch(body.match);
  const systemPrompt = match ? buildMatchSystem(match) : undefined;

  // Préférence qualité : on surclasse le modèle du routeur (sauf modèle forcé).
  let model = forced ? resolveModel(body.model as string) : resolveModel(decision!.model);
  let effort: Effort | undefined;
  if (preferQuality && decision) {
    model = resolveModel(QUALITY_UPGRADE[decision.model]);
    effort = QUALITY_EFFORT;
  }

  try {
    const { result, elapsedMs } = await runExclusive(async () => {
      const started = Date.now();
      const r = await runAgent({ question, bridge, model, maxTurns: ASK_MAX_TURNS, effort, systemPrompt });
      return { result: r, elapsedMs: Date.now() - started };
    });

    const corpus = result.toolCalls.map((t) => t.resultText).join("\n");
    const grounding = checkGrounding(result.answer, corpus);
    const opusCost = estimateCostUsd(result.usage, MODELS.opus.pricing);

    sendJson(res, 200, {
      answer: result.answer,
      model: { id: model.id, label: model.label },
      tier: decision?.tier ?? "forced",
      reasons: decision?.reasons ?? ["forced"],
      quality: preferQuality,
      turns: result.turns,
      tools: result.toolCalls.map((t) => ({ name: t.name, isError: t.isError })),
      grounding: {
        ok: grounding.ok,
        grounded: grounding.grounded.length,
        derived: grounding.derived.length,
        ungrounded: grounding.ungrounded.map((n) => n.raw),
      },
      costUsd: result.costUsd,
      allOpusCostUsd: opusCost,
      latencyMs: elapsedMs,
    });
  } catch (error) {
    console.error("[ask] error:", error instanceof Error ? error.message : error);
    sendJson(res, 502, { error: "agent_failed", message: "L'agent n'a pas pu répondre. Réessaie dans un instant." });
  }
}

// ─── /previews ───────────────────────────────────────────────────────────────

interface PreviewCacheEntry {
  at: number;
  payload: unknown;
}
const previewCache = new Map<string, PreviewCacheEntry>();

async function handlePreviews(res: ServerResponse, url: URL): Promise<void> {
  if (!hasCredentials()) {
    sendJson(res, 503, { error: "no_credentials", message: "The agent service has no Anthropic API key configured." });
    return;
  }

  const day = Number(url.searchParams.get("day") ?? "0") || 0;
  const rawLimit = Number(url.searchParams.get("limit") ?? String(PREVIEW_DEFAULT_LIMIT));
  const limit = Math.max(1, Math.min(PREVIEW_MAX_LIMIT, Number.isFinite(rawLimit) ? rawLimit : PREVIEW_DEFAULT_LIMIT));
  // « Qualité IA » : avant-matchs sur un modèle plus capable (Opus + effort haut),
  // mis en cache séparément du mode éco.
  const quality = url.searchParams.get("quality") === "1";
  const previewModel = quality ? MODELS.opus : PREVIEW_MODEL;
  const previewEffort: Effort | undefined = quality ? QUALITY_EFFORT : PREVIEW_EFFORT;
  const key = `${day}:${limit}:${quality ? "q" : "e"}`;

  const cached = previewCache.get(key);
  if (cached && Date.now() - cached.at < PREVIEW_CACHE_TTL_MS) {
    sendJson(res, 200, { ...cached.payload as object, cached: true });
    return;
  }

  try {
    const payload = await runExclusive(async () => {
      const slate: GameRef[] = await getSlate(bridge, day);
      if (slate.length === 0) {
        return { day, date: null as string | null, previews: [] as unknown[] };
      }
      const games = slate.slice(0, limit);
      const previews = [];
      for (const game of games) {
        const p = await generatePreview(bridge, game, previewModel, previewEffort);
        previews.push({
          gameId: p.game.gameId,
          title: p.title,
          briefing: p.briefing,
          grounding: {
            ok: p.grounding.ok,
            grounded: p.grounding.grounded.length,
            derived: p.grounding.derived.length,
            ungrounded: p.grounding.ungrounded.map((n) => n.raw),
          },
          costUsd: p.agent.costUsd,
          tools: p.agent.toolCalls.map((t) => ({ name: t.name, isError: t.isError })),
        });
      }
      return { day, date: slate[0]?.date ?? null, previews };
    });

    previewCache.set(key, { at: Date.now(), payload });
    sendJson(res, 200, { ...payload as object, cached: false });
  } catch (error) {
    console.error("[previews] error:", error instanceof Error ? error.message : error);
    sendJson(res, 502, { error: "previews_failed", message: "Les avant-matchs n'ont pas pu être générés." });
  }
}

// ─── /match-preview (debrief à la demande pour un match du Face-à-Face) ───────

const matchPreviewCache = new Map<string, PreviewCacheEntry>();

async function handleMatchPreview(res: ServerResponse, url: URL): Promise<void> {
  if (!hasCredentials()) {
    sendJson(res, 503, { error: "no_credentials", message: "The agent service has no Anthropic API key configured." });
    return;
  }

  const homeTeamId = Number(url.searchParams.get("home_team_id"));
  const awayTeamId = Number(url.searchParams.get("away_team_id"));
  if (!Number.isFinite(homeTeamId) || !Number.isFinite(awayTeamId) || homeTeamId <= 0 || awayTeamId <= 0) {
    sendJson(res, 400, { error: "bad_match", message: "home_team_id et away_team_id sont requis." });
    return;
  }
  const homeName = (url.searchParams.get("home_name") ?? "").trim().slice(0, 60);
  const awayName = (url.searchParams.get("away_name") ?? "").trim().slice(0, 60);
  const quality = url.searchParams.get("quality") === "1";
  const previewModel = quality ? MODELS.opus : PREVIEW_MODEL;
  const previewEffort: Effort | undefined = quality ? QUALITY_EFFORT : PREVIEW_EFFORT;
  const key = `${homeTeamId}:${awayTeamId}:${quality ? "q" : "e"}`;

  const cached = matchPreviewCache.get(key);
  if (cached && Date.now() - cached.at < PREVIEW_CACHE_TTL_MS) {
    sendJson(res, 200, { ...(cached.payload as object), cached: true });
    return;
  }

  try {
    const payload = await runExclusive(async () => {
      const p = await generateMatchupPreview(
        bridge,
        {
          homeTeamId,
          awayTeamId,
          homeName: homeName || `équipe ${homeTeamId}`,
          awayName: awayName || `équipe ${awayTeamId}`,
        },
        previewModel,
        previewEffort,
      );
      return {
        title: p.title,
        briefing: p.briefing,
        grounding: {
          ok: p.grounding.ok,
          grounded: p.grounding.grounded.length,
          derived: p.grounding.derived.length,
          ungrounded: p.grounding.ungrounded.map((n) => n.raw),
        },
        model: { id: p.agent.model.id, label: p.agent.model.label },
        costUsd: p.agent.costUsd,
        tools: p.agent.toolCalls.map((t) => ({ name: t.name, isError: t.isError })),
      };
    });

    matchPreviewCache.set(key, { at: Date.now(), payload });
    sendJson(res, 200, { ...(payload as object), cached: false });
  } catch (error) {
    console.error("[match-preview] error:", error instanceof Error ? error.message : error);
    sendJson(res, 502, { error: "match_preview_failed", message: "Le debrief du match n'a pas pu être généré." });
  }
}

// ─── router ──────────────────────────────────────────────────────────────────

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);
  const method = req.method ?? "GET";

  if (method === "GET" && url.pathname === "/health") {
    let tools = 0;
    try {
      tools = (await bridge.listAnthropicTools()).length;
    } catch {
      /* bridge not ready */
    }
    sendJson(res, 200, { ok: true, tools, credentials: hasCredentials() });
    return;
  }

  if (method === "POST" && url.pathname === "/ask") {
    await handleAsk(req, res);
    return;
  }

  if (method === "GET" && url.pathname === "/previews") {
    await handlePreviews(res, url);
    return;
  }

  if (method === "GET" && url.pathname === "/match-preview") {
    await handleMatchPreview(res, url);
    return;
  }

  sendJson(res, 404, { error: "not_found", message: `No route for ${method} ${url.pathname}` });
}

async function main(): Promise<void> {
  loadAnthropicEnv(); // pick up ANTHROPIC_* from the project .env if not already set

  bridge = new McpBridge();
  await bridge.connect();
  const toolCount = (await bridge.listAnthropicTools()).length;

  const server = createServer((req, res) => {
    handle(req, res).catch((error) => {
      console.error("[server] unhandled:", error instanceof Error ? error.message : error);
      if (!res.headersSent) sendJson(res, 500, { error: "internal", message: "internal error" });
    });
  });

  server.listen(PORT, HOST, () => {
    console.error(
      `nba-agent service on http://${HOST}:${PORT} · ${toolCount} MCP tools · ` +
        `credentials: ${hasCredentials() ? "yes" : "NO (set ANTHROPIC_API_KEY)"}`,
    );
  });

  const shutdown = async (): Promise<void> => {
    server.close();
    await bridge.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Failed to start nba-agent service:", error instanceof Error ? error.message : error);
  process.exit(1);
});
