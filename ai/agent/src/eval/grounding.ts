/**
 * Programmatic factuality check — the heart of the project's eval pillar.
 *
 * An answer is "grounded" when every distinctive figure it states traces back
 * to a tool result from the same run. We check the figures that act as a
 * fingerprint — decimals (112.7, -1.2), percentages (44.7%), and long ids
 * (1610612744) — because those are what a model would have to *invent* to
 * hallucinate a stat, and they cannot match the tool output by coincidence.
 *
 * We deliberately do NOT flag plain small integers (counts like "5 games",
 * per-100 figures like "100 possessions", derived sums): they are often
 * computed from grounded numbers and would produce false alarms. A factuality
 * check that cries wolf is worse than one scoped to the figures that matter.
 *
 * Handled subtleties: French decimal commas (112,7 == 112.7); percent/fraction
 * conversion (44.7% is grounded by a tool value of 0.447); and years/seasons
 * (1995-96, 2026-27) are stripped so an echoed year is never mistaken for an
 * invented id.
 */

export interface SigNumber {
  raw: string;
  value: number;
  isPercent: boolean;
  isBigInt: boolean;
}

// A number, optionally followed by a percent sign.
const NUM_RE = /(-?\d+(?:[.,]\d+)?)\s*(%)?/g;
// Season / date fragments to remove before extraction (2026-27, 2026-11-21, 1995-96).
const DATE_RE = /\b\d{4}-\d{2}(?:-\d{2})?\b/g;

function stripDates(text: string): string {
  return text.replace(DATE_RE, " ");
}

function isYear(value: number, hasDecimal: boolean): boolean {
  return !hasDecimal && value >= 1900 && value <= 2099;
}

/** Extract the distinctive ("fingerprint") numbers from a piece of text. */
export function extractSignificantNumbers(text: string): SigNumber[] {
  const cleaned = stripDates(text);
  const out: SigNumber[] = [];
  for (const m of cleaned.matchAll(NUM_RE)) {
    const rawNum = m[1];
    const isPercent = Boolean(m[2]);
    const hasDecimal = /[.,]/.test(rawNum);
    const value = Number(rawNum.replace(",", "."));
    if (!Number.isFinite(value)) continue;
    if (isYear(value, hasDecimal)) continue;
    const isBigInt = !hasDecimal && Math.abs(value) >= 1000;
    // Significant = decimal, percentage, or long id. Plain small ints are noise.
    if (!hasDecimal && !isPercent && !isBigInt) continue;
    out.push({ raw: isPercent ? `${rawNum}%` : rawNum, value, isPercent, isBigInt });
  }
  return out;
}

/** Every number present in a text (for use as the grounding corpus). */
function allNumbers(text: string): number[] {
  const cleaned = stripDates(text);
  const nums: number[] = [];
  for (const m of cleaned.matchAll(NUM_RE)) {
    const value = Number(m[1].replace(",", "."));
    if (Number.isFinite(value)) nums.push(value);
  }
  return nums;
}

function near(a: number, b: number): boolean {
  const diff = Math.abs(a - b);
  return diff <= 0.15 || diff <= Math.abs(b) * 0.01;
}

export interface GroundingReport {
  grounded: SigNumber[];
  ungrounded: SigNumber[];
  /** True when nothing distinctive in the answer is unaccounted for. */
  ok: boolean;
}

/**
 * Check an answer's figures against the concatenated tool-result text.
 */
export function checkGrounding(answer: string, corpus: string): GroundingReport {
  const corpusNums = allNumbers(corpus);
  const grounded: SigNumber[] = [];
  const ungrounded: SigNumber[] = [];

  const matches = (n: SigNumber): boolean => {
    for (const c of corpusNums) {
      if (n.isBigInt) {
        if (c === n.value) return true;
        continue;
      }
      if (near(c, n.value)) return true;
      if (n.isPercent) {
        // 44.7% grounded by a tool value of 0.447, or by a literal 44.7.
        if (near(c * 100, n.value)) return true;
        if (near(c, n.value / 100)) return true;
      }
    }
    return false;
  };

  for (const n of extractSignificantNumbers(answer)) {
    (matches(n) ? grounded : ungrounded).push(n);
  }

  return { grounded, ungrounded, ok: ungrounded.length === 0 };
}
