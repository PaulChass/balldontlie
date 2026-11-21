/**
 * Offline self-test for the complexity router (no key, no network).
 *
 * Locks the routing policy to expected decisions on representative questions,
 * so a change to the patterns can't silently re-route traffic (and cost).
 *
 * Run with: npm run router-check
 */
import { strict as assert } from "node:assert";
import { route } from "../src/router.js";

type ExpectedModel = "haiku" | "sonnet" | "opus";

const CASES: [string, ExpectedModel][] = [
  // Light: pure lookups.
  ["Quels matchs NBA se jouent ce soir ?", "haiku"],
  ["Quel est l'identifiant d'équipe des Warriors ?", "haiku"],
  ["Quels sont les joueurs blessés chez les Lakers ?", "haiku"],
  ["Quels ont été les scores d'hier ?", "haiku"],
  // Standard: single-entity stats.
  ["Quel est le bilan des Boston Celtics cette saison ?", "sonnet"],
  ["Combien de points par match marque Stephen Curry ?", "sonnet"],
  ["Donne le net rating des Nuggets.", "sonnet"],
  // Heavy: comparison / preview / analysis.
  ["Compare les Celtics et les Warriors cette saison.", "opus"],
  ["Fais-moi l'avant-match de Lakers contre Nuggets ce soir.", "opus"],
  ["Pourquoi les Warriors sont-ils en perte de forme ?", "opus"],
  ["Qui a l'avantage dans la confrontation Celtics vs Knicks ?", "opus"],
  // Unknown → safe mid-tier.
  ["Raconte-moi quelque chose sur la NBA.", "sonnet"],
];

let n = 0;
for (const [question, expected] of CASES) {
  const decision = route(question);
  assert.equal(
    decision.model,
    expected,
    `"${question}" -> ${decision.model} (${decision.reasons.join(", ")}), expected ${expected}`,
  );
  n++;
  console.error(`✓ [${decision.tier}] ${decision.model} ← ${question}`);
}

console.error(`\nRouter self-test passed (${n} cases).`);
