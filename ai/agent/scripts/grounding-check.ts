/**
 * Offline self-test for the grounding checker (the eval's own correctness).
 *
 * No API key, no network — crafted answer/corpus pairs prove the check flags an
 * invented number, accepts a grounded one, converts percentages, and never
 * trips on echoed years or derived small integers.
 *
 * Run with: npm run grounding-check
 */
import { strict as assert } from "node:assert";
import { checkGrounding } from "../src/eval/grounding.js";

let n = 0;
const ok = (label: string, cond: boolean) => {
  assert.ok(cond, `FAILED: ${label}`);
  n++;
  console.error(`✓ ${label}`);
};

// 1. Grounded decimals (French comma vs tool dot).
{
  const r = checkGrounding(
    "Leur net rating est de -1,2 et ils marquent 112,7 points par match.",
    "NET_RATING: -1.2 | PTS: 112.7 | PACE: 99.2",
  );
  ok("grounded decimals pass", r.ok && r.grounded.length === 2 && r.ungrounded.length === 0);
}

// 2. Percentage grounded by a fractional tool value (44.7% <- 0.447).
{
  const r = checkGrounding("Ils tirent à 44,7 % au tir.", "FG_PCT: 0.447");
  ok("percentage/fraction conversion", r.ok && r.grounded.length === 1);
}

// 3. Invented figure with no supporting tool data is flagged.
{
  const r = checkGrounding("Michael Jordan marquait 30,1 points par match.", "");
  ok("invented decimal flagged", !r.ok && r.ungrounded.some((x) => x.value === 30.1));
}

// 4. Long ids: exact match grounds, a wrong id is flagged.
{
  const good = checkGrounding("Team id 1610612744.", "TEAM_ID 1610612744");
  const bad = checkGrounding("Team id 1610612745.", "TEAM_ID 1610612744");
  ok("correct id grounded", good.ok);
  ok("wrong id flagged", !bad.ok && bad.ungrounded[0].value === 1610612745);
}

// 5. Echoed years/seasons are never mistaken for invented numbers.
{
  const r = checkGrounding(
    "Je n'ai aucune donnée pour la saison 1995-96, ni pour 1996.",
    "",
  );
  ok("years not flagged (refusal stays clean)", r.ok && r.ungrounded.length === 0);
}

// 6. Derived / structural small integers are not flagged.
{
  const r = checkGrounding(
    "Sur les 5 derniers matchs et sur 16 matchs au total, pour 100 possessions.",
    "",
  );
  ok("small integers ignored", r.ok && r.ungrounded.length === 0);
}

// 7. A differential (difference of two tool values) is "derived", not invented.
{
  const r = checkGrounding(
    "L'écart de net rating est de 15,5 points.",
    "PHI NET_RATING 2.7 | MIL NET_RATING -12.8",
  );
  ok(
    "pairwise differential counts as derived",
    r.ok && r.derived.some((x) => x.value === 15.5) && r.ungrounded.length === 0,
  );
}

// 8. An invented number that is NOT a simple derivation is still flagged.
{
  const r = checkGrounding("Il a marqué 73,9 points.", "PHI NET_RATING 2.7 | MIL NET_RATING -12.8");
  ok("non-derivable invention still flagged", !r.ok && r.ungrounded.some((x) => x.value === 73.9));
}

console.error(`\nGrounding self-test passed (${n} assertions).`);
