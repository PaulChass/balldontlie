/**
 * Port of the PHP `MatchsDeLaNuit` service.
 *
 * Source: the NBA static CDN full-season schedule (scheduleLeagueV2.json), not
 * ESPN. We resolve the target calendar day in US Eastern time (the league's day
 * boundary) and return that day's games with teams, status and tip-off time.
 */
import { NBA_CDN_HEADERS, SCHEDULE_URL } from "../constants.js";
import { nbaFetchJson } from "./client.js";

/** A game on the night's slate, normalised for tool output. */
export interface ScheduledGame {
  gameId: string;
  /** ISO date (YYYY-MM-DD) of the game in US Eastern time. */
  date: string;
  /** 1 = scheduled, 2 = in progress, 3 = final (NBA `gameStatus`). */
  status: number;
  /** Raw league status text, e.g. "7:30 pm ET", "Final", "Q3 4:12". */
  statusText: string;
  /** Tip-off time as an ISO-8601 UTC timestamp, when known. */
  startTimeUtc: string | null;
  home: GameTeam;
  away: GameTeam;
}

export interface GameTeam {
  teamId: number;
  tricode: string;
  city: string;
  name: string;
  /** Current/final score; 0 before tip-off. */
  score: number;
}

// ---- Minimal shapes of the upstream JSON (only the fields we read) ----

interface ScheduleResponse {
  leagueSchedule?: {
    gameDates?: ScheduleGameDate[];
  };
}

interface ScheduleGameDate {
  gameDate?: string; // "MM/DD/YYYY HH:MM:SS"
  games?: ScheduleGame[];
}

interface ScheduleGame {
  gameId?: string;
  gameStatus?: number;
  gameStatusText?: string;
  gameDateTimeUTC?: string | null;
  homeTeam?: ScheduleTeam;
  awayTeam?: ScheduleTeam;
}

interface ScheduleTeam {
  teamId?: number;
  teamName?: string;
  teamCity?: string;
  teamTricode?: string;
  score?: number;
}

/** "MM/DD/YYYY" for a Date, in the given IANA time zone. */
function dateKeyInZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("month")}/${get("day")}/${get("year")}`;
}

/** Convert "MM/DD/YYYY" (or that prefix of a longer string) to "YYYY-MM-DD". */
function toIsoDate(usDate: string): string {
  const [mm, dd, yyyy] = usDate.trim().split(/[\s/]+/);
  return `${yyyy}-${mm}-${dd}`;
}

function normaliseTeam(team: ScheduleTeam | undefined): GameTeam {
  return {
    teamId: team?.teamId ?? 0,
    tricode: team?.teamTricode ?? "",
    city: team?.teamCity ?? "",
    name: team?.teamName ?? "",
    score: team?.score ?? 0,
  };
}

/**
 * Fetch the games scheduled for a given day.
 *
 * @param dayOffset 0 = today (US Eastern), 1 = tomorrow, etc. Negative allowed.
 * @param signal    Optional caller cancellation signal.
 * @returns The day's games (possibly empty if no games are scheduled).
 */
export async function getScheduledGames(
  dayOffset: number,
  signal?: AbortSignal,
): Promise<ScheduledGame[]> {
  const schedule = await nbaFetchJson<ScheduleResponse>(
    SCHEDULE_URL,
    "cdn.nba.com schedule",
    signal,
    NBA_CDN_HEADERS,
  );

  const target = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
  const targetKey = dateKeyInZone(target, "America/New_York");

  const gameDates = schedule.leagueSchedule?.gameDates ?? [];
  const match = gameDates.find(
    (gd) => (gd.gameDate ?? "").trim().split(/\s+/)[0] === targetKey,
  );
  if (!match?.games) return [];

  return gamesForDate(match, targetKey);
}

function gamesForDate(gameDate: ScheduleGameDate, key: string): ScheduledGame[] {
  return (gameDate.games ?? []).map((game) => ({
    gameId: game.gameId ?? "",
    date: toIsoDate(key),
    status: game.gameStatus ?? 1,
    statusText: (game.gameStatusText ?? "").trim(),
    startTimeUtc: game.gameDateTimeUTC ?? null,
    home: normaliseTeam(game.homeTeam),
    away: normaliseTeam(game.awayTeam),
  }));
}

/**
 * Find the most recent day (today or earlier, US Eastern) that has at least one
 * finished game, and return that day's finished games with scores.
 *
 * @param maxDaysBack How many days back to scan from today before giving up.
 */
export async function getRecentResults(
  maxDaysBack: number,
  signal?: AbortSignal,
): Promise<ScheduledGame[]> {
  const schedule = await nbaFetchJson<ScheduleResponse>(
    SCHEDULE_URL,
    "cdn.nba.com schedule",
    signal,
    NBA_CDN_HEADERS,
  );
  const gameDates = schedule.leagueSchedule?.gameDates ?? [];
  const byKey = new Map<string, ScheduleGameDate>();
  for (const gd of gameDates) {
    const key = (gd.gameDate ?? "").trim().split(/\s+/)[0];
    if (key) byKey.set(key, gd);
  }

  for (let offset = 0; offset >= -maxDaysBack; offset--) {
    const day = new Date(Date.now() + offset * 24 * 60 * 60 * 1000);
    const key = dateKeyInZone(day, "America/New_York");
    const gd = byKey.get(key);
    if (!gd) continue;
    const finals = gamesForDate(gd, key).filter((g) => g.status === 3);
    if (finals.length > 0) return finals;
  }
  return [];
}
