/**
 * Port of the PHP `StatsManager::teamStats`.
 *
 * Source: stats.nba.com `leaguedashteamstats`, the league-wide per-game team
 * dashboard, filterable by last-N games, home/road, opponent, outcome, pace and
 * season type. Columns are read by header name (not by magic index as the PHP
 * did), and the full team row is returned so every value is traceable.
 */
import { DEFAULT_SEASON, STATS_BASE_URL } from "../constants.js";
import { nbaFetchJson, num, rowsByHeader, str, type ResultSet } from "./client.js";

export type MeasureType = "Base" | "Advanced" | "Defense";
export type SeasonType = "Regular Season" | "Playoffs" | "Pre Season";
export type LocationFilter = "Home" | "Road" | "all";
export type OutcomeFilter = "W" | "L" | "all";

export interface TeamStatsQuery {
  teamId: number;
  measureType: MeasureType;
  season: string;
  seasonType: SeasonType;
  /** 0 = full season, otherwise the last N games. */
  lastNGames: number;
  location: LocationFilter;
  outcome: OutcomeFilter;
  /** Restrict to games against this opponent team id; 0 = any opponent. */
  opponentTeamId: number;
  paceAdjust: boolean;
}

export interface TeamStatsResult {
  teamId: number;
  teamName: string;
  measureType: MeasureType;
  season: string;
  /** Echo of the filters that produced these numbers. */
  filters: {
    seasonType: SeasonType;
    lastNGames: number;
    location: LocationFilter;
    outcome: OutcomeFilter;
    opponentTeamId: number;
    paceAdjust: boolean;
  };
  /**
   * Every column of the team's dashboard row, keyed by the API header name
   * (e.g. PTS, OFF_RATING, DEF_RATING, PACE). Values are the raw API numbers,
   * so any figure in an answer can be traced back to a field here.
   */
  stats: Record<string, number | string | null>;
}

interface LeagueDashResponse {
  resultSets?: ResultSet[];
}

function buildUrl(query: TeamStatsQuery): string {
  const params: Record<string, string> = {
    College: "",
    Conference: "",
    Country: "",
    DateFrom: "",
    DateTo: "",
    Division: "",
    GameScope: "",
    GameSegment: "",
    Height: "",
    ISTRound: "",
    LastNGames: String(query.lastNGames),
    LeagueID: "00",
    Location: query.location === "all" ? "" : query.location,
    MeasureType: query.measureType,
    Month: "0",
    OpponentTeamID: String(query.opponentTeamId),
    Outcome: query.outcome === "all" ? "" : query.outcome,
    PORound: "0",
    PaceAdjust: query.paceAdjust ? "Y" : "N",
    PerMode: "PerGame",
    Period: "0",
    PlayerExperience: "",
    PlayerPosition: "",
    PlusMinus: "N",
    Rank: "N",
    Season: query.season,
    SeasonSegment: "",
    SeasonType: query.seasonType,
    ShotClockRange: "",
    StarterBench: "",
    TeamID: String(query.teamId),
    TwoWay: "0",
    VsConference: "",
    VsDivision: "",
    Weight: "",
  };
  const search = new URLSearchParams(params).toString();
  return `${STATS_BASE_URL}/leaguedashteamstats?${search}`;
}

/** Fetch one team's dashboard row for the given measure type and filters. */
export async function getTeamStats(
  query: TeamStatsQuery,
  signal?: AbortSignal,
): Promise<TeamStatsResult> {
  const data = await nbaFetchJson<LeagueDashResponse>(
    buildUrl(query),
    "stats.nba.com",
    signal,
  );

  const resultSet = data.resultSets?.[0];
  if (!resultSet || !Array.isArray(resultSet.headers)) {
    throw new Error("stats.nba.com returned an unexpected response (no resultSet).");
  }

  const rows = rowsByHeader(resultSet);
  const row = rows.find((r) => num(r, "TEAM_ID") === query.teamId);
  if (!row) {
    throw new Error(
      `No ${query.measureType} row found for team ${query.teamId} with these filters. ` +
        `The filters may exclude every game (e.g. lastNGames too small, or no games vs that opponent).`,
    );
  }

  // Keep every column except the redundant id/name, which we surface separately.
  const stats: Record<string, number | string | null> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === "TEAM_ID" || key === "TEAM_NAME") continue;
    stats[key] =
      typeof value === "number" || typeof value === "string" ? value : value == null ? null : String(value);
  }

  return {
    teamId: query.teamId,
    teamName: str(row, "TEAM_NAME") ?? `Team ${query.teamId}`,
    measureType: query.measureType,
    season: query.season,
    filters: {
      seasonType: query.seasonType,
      lastNGames: query.lastNGames,
      location: query.location,
      outcome: query.outcome,
      opponentTeamId: query.opponentTeamId,
      paceAdjust: query.paceAdjust,
    },
    stats,
  };
}

export { DEFAULT_SEASON };
