/**
 * Golden question set for the factuality eval.
 *
 * Because live stats change daily, a case cannot assert a fixed numeric answer.
 * Instead every case asserts STABLE properties:
 *  - grounded cases: the answer invents no distinctive figure (checkGrounding),
 *    plus any stable "golden" string that must appear (e.g. a team id).
 *  - refusal cases: the answer invents no figure AND visibly declines, so a
 *    question the tools cannot answer never yields a confident number.
 *
 * This keeps the eval reproducible on any day while still catching the one
 * failure that matters: a number that does not trace to a tool result.
 */

export type CaseType = "grounded" | "refusal";

export interface EvalCase {
  id: string;
  question: string;
  type: CaseType;
  model?: string;
  /** Stable substrings the answer must contain (golden facts). */
  mustContain?: string[];
  /** For refusal cases: at least one of these markers must appear. */
  refusalMarkers?: string[];
}

const REFUSAL_MARKERS = [
  "ne peux",
  "ne vais pas",
  "aucun",
  "aucune donnée",
  "pas de donnée",
  "pas de données",
  "n'a renvoyé",
  "n'ont renvoyé",
  "de mémoire",
  "ne peux pas prédire",
  "pas en mesure",
  "impossible de prédire",
];

export const CASES: EvalCase[] = [
  {
    id: "team-id-golden",
    question: "Quel est l'identifiant d'équipe (team id) des Golden State Warriors ?",
    type: "grounded",
    mustContain: ["1610612744"],
  },
  {
    id: "tonight-slate",
    question: "Quels matchs NBA se jouent aujourd'hui ? Liste les équipes qui s'affrontent.",
    type: "grounded",
  },
  {
    id: "celtics-netrating",
    question: "Donne le bilan (victoires-défaites) et le net rating des Boston Celtics cette saison.",
    type: "grounded",
  },
  {
    // NB: this queries LITERAL per-game figures, not averages. The eval's
    // guarantee is literal grounding; when asked for averages the agent derives
    // them from these same per-game lines (and shows its work) — correct, but
    // not literally traceable, so golden cases ask for the literal numbers.
    id: "curry-gamelog",
    question:
      "Parmi les 5 derniers matchs de Stephen Curry, lesquels ont dépassé 30 points ? Donne le total de points de chacun de ces matchs, sans calculer de moyenne.",
    type: "grounded",
  },
  {
    id: "refusal-historical",
    question: "Combien de points par match Michael Jordan marquait-il lors de la saison 1995-96 ?",
    type: "refusal",
    refusalMarkers: REFUSAL_MARKERS,
  },
  {
    id: "refusal-prediction",
    question: "Quel sera le score exact du prochain match des Los Angeles Lakers ?",
    type: "refusal",
    refusalMarkers: REFUSAL_MARKERS,
  },
];
