/**
 * Deterministic complexity router (cost pillar).
 *
 * Picks the cheapest model that can do the job, from an explainable policy —
 * no black box, no extra LLM call:
 *   - light   → Haiku 5.5   : a single factual lookup (who plays, injuries, a
 *                             score, an id). One tool call, no reasoning.
 *   - standard→ Sonnet 5.5  : a single-entity stat question (a team's record,
 *                             a player's line). Resolve + a stat call.
 *   - heavy   → Opus 5.5    : comparison, preview, "why", multi-step analysis.
 *
 * When signals are ambiguous it defaults to Sonnet — capable and mid-priced —
 * never Haiku, so routing never under-serves a hard question to save a cent.
 * Any explicit --model on the CLI overrides the router.
 */
import type { ModelKey } from "./models.js";

export type Tier = "light" | "standard" | "heavy";

export interface RouteDecision {
  model: ModelKey;
  tier: Tier;
  reasons: string[];
}

// Comparison / analysis / multi-step markers → heavy.
const HEAVY_PATTERNS: [RegExp, string][] = [
  [/\bcompar/i, "comparison"],
  [/\bvs\b|\bv\.?s\.?\b/i, "versus"],
  [/\bcontre\b|face à|face au/i, "matchup"],
  [/\bpreview\b|avant[- ]?match|aperçu/i, "preview"],
  [/analys|décort|explique pourquoi|pourquoi/i, "analysis"],
  [/\bforme\b|tendance|dynamique|série/i, "form/trend"],
  [/head[- ]?to[- ]?head|confrontation|h2h/i, "head-to-head"],
  [/\bmeilleur|\bmieux\b|qui domine|avantage/i, "evaluation"],
  [/\bcontexte\b|que disent les (chiffres|stats)/i, "synthesis"],
];

// Single-entity statistical questions → standard.
const STANDARD_PATTERNS: [RegExp, string][] = [
  [/\bstat(istiques?)?\b/i, "stats"],
  [/combien de (points|passes|rebonds|paniers)/i, "box stat"],
  [/\bbilan\b|victoires?[- ]?défaites?|record/i, "record"],
  [/\bmoyenne/i, "average"],
  [/net rating|offensive rating|defensive rating|true shooting|\bpace\b/i, "advanced stat"],
  [/points par match|par match/i, "per-game"],
];

// Pure lookups → light.
const LIGHT_PATTERNS: [RegExp, string][] = [
  [/qui joue|quels? matchs?|y a-t-il des matchs|programme/i, "schedule"],
  [/\bce soir\b|aujourd'hui|cette nuit|demain|hier/i, "day lookup"],
  [/à quelle heure|\bquand\b|horaire/i, "time lookup"],
  [/\bscores?\b|\brésultats?\b/i, "score lookup"],
  [/bless|forfait|indisponible|absent/i, "injury lookup"],
  [/identifiant|team ?id|player ?id|\bid\b/i, "id lookup"],
  [/\bcalendrier\b|\bliste\b/i, "listing"],
];

function matched(patterns: [RegExp, string][], q: string): string[] {
  return patterns.filter(([re]) => re.test(q)).map(([, label]) => label);
}

export function route(question: string): RouteDecision {
  const q = question.trim();
  const heavy = matched(HEAVY_PATTERNS, q);
  const standard = matched(STANDARD_PATTERNS, q);
  const light = matched(LIGHT_PATTERNS, q);

  if (heavy.length > 0) {
    return { model: "opus", tier: "heavy", reasons: heavy.map((r) => `heavy:${r}`) };
  }
  if (standard.length > 0) {
    return { model: "sonnet", tier: "standard", reasons: standard.map((r) => `standard:${r}`) };
  }
  if (light.length > 0) {
    return { model: "haiku", tier: "light", reasons: light.map((r) => `light:${r}`) };
  }
  // Unknown shape: don't risk under-serving — use the capable mid-tier.
  return { model: "sonnet", tier: "standard", reasons: ["default:unclassified"] };
}
