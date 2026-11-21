/**
 * LLM-as-judge for previews — the editorial counterpart to the deterministic
 * grounding check.
 *
 * Grounding (checkGrounding) proves the numbers are real; the judge scores what
 * a deterministic check can't: clarity, analytical insight, usefulness,
 * structure, and — critically — that the tone stays analytical and never incites
 * betting. It returns a structured verdict so results aggregate across a slate.
 *
 * The judge runs on a cheaper model (Sonnet 5.5 by default): judging is lighter
 * than generating.
 */
import Anthropic from "@anthropic-ai/sdk";
import { addUsage, emptyUsage, estimateCostUsd, MODELS, type ModelSpec, type UsageTotals } from "../models.js";

export interface JudgeScores {
  clarity: number;
  insight: number;
  usefulness: number;
  structure: number;
  tone: number;
}

export interface JudgeVerdict {
  scores: JudgeScores;
  overall: number;
  /** true means the text incites betting — a hard fail. */
  gamblingIncitement: boolean;
  pass: boolean;
  rationale: string;
}

export interface JudgeOutcome {
  verdict: JudgeVerdict;
  usage: UsageTotals;
  costUsd: number;
  model: ModelSpec;
}

const JUDGE_SYSTEM = `Tu es un juge éditorial STRICT pour des avant-matchs NBA. Tu évalues la QUALITÉ RÉDACTIONNELLE d'un texte (la véracité des chiffres est vérifiée ailleurs, ne la note pas).

Note chaque critère de 1 (médiocre) à 5 (excellent) :
- clarity : clair, lisible, sans jargon inutile.
- insight : analyse réelle, pas une simple liste de chiffres.
- usefulness : utile pour quelqu'un qui veut comprendre le match avant qu'il commence.
- structure : respecte le format attendu (Forme, Clés, Confrontation, Blessés, À suivre).
- tone : analytique et sobre.

Signale gamblingIncitement = true si le texte incite à parier, conseille une mise, ou présente un pronostic comme une certitude. Un angle purement descriptif ("ce que disent les chiffres") n'est PAS de l'incitation.

Réponds UNIQUEMENT par un objet JSON, sans texte autour, de la forme exacte :
{"scores":{"clarity":N,"insight":N,"usefulness":N,"structure":N,"tone":N},"overall":N,"gamblingIncitement":false,"rationale":"une phrase"}`;

function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(1, Math.min(5, Math.round(v)));
}

/** Pull the first JSON object out of the model's reply, tolerant of stray prose. */
function extractJson(text: string): Record<string, unknown> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("no JSON object in judge reply");
  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
}

export async function judgePreview(
  briefing: string,
  options: { model?: ModelSpec; client?: Anthropic } = {},
): Promise<JudgeOutcome> {
  const model = options.model ?? MODELS.sonnet;
  const client = options.client ?? new Anthropic();

  const response = await client.messages.create({
    model: model.id,
    max_tokens: 1200,
    system: JUDGE_SYSTEM,
    messages: [{ role: "user", content: `Avant-match à juger :\n\n${briefing}` }],
  });

  const usage = emptyUsage();
  addUsage(usage, response.usage);
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const raw = extractJson(text);
  const rawScores = (raw.scores ?? {}) as Record<string, unknown>;
  const scores: JudgeScores = {
    clarity: clampScore(rawScores.clarity),
    insight: clampScore(rawScores.insight),
    usefulness: clampScore(rawScores.usefulness),
    structure: clampScore(rawScores.structure),
    tone: clampScore(rawScores.tone),
  };
  const overall = clampScore(raw.overall);
  const gamblingIncitement = raw.gamblingIncitement === true;
  const verdict: JudgeVerdict = {
    scores,
    overall,
    gamblingIncitement,
    pass: overall >= 3 && !gamblingIncitement,
    rationale: typeof raw.rationale === "string" ? raw.rationale : "",
  };

  return { verdict, usage, costUsd: estimateCostUsd(usage, model.pricing), model };
}
