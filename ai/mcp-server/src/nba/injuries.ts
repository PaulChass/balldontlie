/**
 * Port of the PHP `StatsManager::injury`.
 *
 * Source: Rotowire's public NBA injury-report table (JSON). We filter by team,
 * reconciling Rotowire's team codes with NBA tricodes where they differ.
 */
import { nbaFetchJson } from "./client.js";
import { teamById } from "./teams.js";

const ROTOWIRE_URL =
  "https://www.rotowire.com/basketball/tables/injury-report.php?team=ALL&pos=ALL";

const BROWSER_HEADERS: Record<string, string> = {
  Accept: "application/json, text/plain, */*",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

/** Rotowire team code -> NBA tricode, for the handful that differ. */
const ROTOWIRE_ALIASES: Record<string, string> = {
  GS: "GSW", NO: "NOP", NY: "NYK", SA: "SAS",
  PHO: "PHX", WSH: "WAS", UTAH: "UTA",
};

interface RotowireRow {
  player?: string;
  team?: string;
  injury?: string;
  status?: string;
}

export interface InjuryEntry {
  player: string;
  injury: string;
  status: string;
}

/** Normalise a Rotowire team code to an NBA tricode. */
function toTricode(code: string): string {
  const upper = code.toUpperCase();
  return ROTOWIRE_ALIASES[upper] ?? upper;
}

/** Current injury report for one team. */
export async function getInjuries(
  teamId: number,
  signal?: AbortSignal,
): Promise<InjuryEntry[]> {
  const team = teamById(teamId);
  if (!team) throw new Error(`Unknown team id ${teamId}.`);

  const rows = await nbaFetchJson<RotowireRow[]>(
    ROTOWIRE_URL,
    "rotowire.com",
    signal,
    BROWSER_HEADERS,
  );
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((r) => r.team && toTricode(r.team) === team.tricode)
    .map((r) => ({
      player: r.player ?? "",
      injury: r.injury ?? "",
      status: r.status ?? "",
    }));
}
