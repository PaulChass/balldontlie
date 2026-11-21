/**
 * Player-centric NBA data: the current-season directory (name -> id), per-team
 * roster stats, and a player's recent game log.
 *
 * Replaces the PHP `StatsManager` player paths (`getAbvFromId`, `playersStats`,
 * `getGraphStats`) with header-name mapping and a cached player directory.
 */
import { DEFAULT_SEASON, STATS_BASE_URL } from "../constants.js";
import { nbaFetchJson, num, rowsByHeader, str, type ResultSet } from "./client.js";
import type { SeasonType } from "./teamStats.js";

interface LeagueDashResponse {
  resultSets?: ResultSet[];
}

// ---- Player directory (name -> id), cached in memory ----

export interface DirectoryPlayer {
  id: number;
  name: string;
  teamId: number;
  teamTricode: string;
}

interface CacheEntry {
  players: DirectoryPlayer[];
  expires: number;
}

/** The directory changes rarely within a season; cache it for an hour. */
const DIRECTORY_TTL_MS = 60 * 60 * 1000;
const directoryCache = new Map<string, CacheEntry>();

function seasonTypeParam(seasonType: SeasonType): string {
  return seasonType.replace(/ /g, "+");
}

/** Fetch (and cache) the list of players active in the given season. */
export async function getPlayerDirectory(
  season: string,
  signal?: AbortSignal,
): Promise<DirectoryPlayer[]> {
  const cached = directoryCache.get(season);
  if (cached && cached.expires > Date.now()) return cached.players;

  const url =
    `${STATS_BASE_URL}/commonallplayers?LeagueID=00&Season=${season}&IsOnlyCurrentSeason=1`;
  const data = await nbaFetchJson<LeagueDashResponse>(url, "stats.nba.com", signal);
  const resultSet = data.resultSets?.[0];
  if (!resultSet) throw new Error("stats.nba.com returned no player directory.");

  const players = rowsByHeader(resultSet).map((row) => ({
    id: num(row, "PERSON_ID") ?? 0,
    name: str(row, "DISPLAY_FIRST_LAST") ?? "",
    teamId: num(row, "TEAM_ID") ?? 0,
    teamTricode: str(row, "TEAM_ABBREVIATION") ?? "",
  }));

  directoryCache.set(season, { players, expires: Date.now() + DIRECTORY_TTL_MS });
  return players;
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

/**
 * Resolve a player name to directory entries, best match first.
 * Exact (normalised) matches rank above substring matches.
 */
export async function resolvePlayer(
  query: string,
  season: string,
  signal?: AbortSignal,
): Promise<DirectoryPlayer[]> {
  const directory = await getPlayerDirectory(season, signal);
  const q = normalise(query);
  const scored = directory
    .map((p) => {
      const name = normalise(p.name);
      let score = 0;
      if (name === q) score = 3;
      else if (name.startsWith(q)) score = 2;
      else if (name.includes(q)) score = 1;
      return { player: p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.player.name.localeCompare(b.player.name));
  return scored.map((s) => s.player);
}

// ---- Per-team roster stats (leaguedashplayerstats) ----

export interface PlayerSeasonStat {
  playerId: number;
  playerName: string;
  stats: Record<string, number | null>;
}

const ROSTER_FIELDS = [
  "GP", "MIN", "PTS", "REB", "AST", "STL", "BLK", "TOV",
  "FG_PCT", "FG3_PCT", "FG3A", "FT_PCT", "PLUS_MINUS",
];

/** Per-game stats for every player on a team, sorted by minutes played. */
export async function getPlayersStats(
  teamId: number,
  season: string,
  seasonType: SeasonType,
  lastNGames: number,
  signal?: AbortSignal,
): Promise<PlayerSeasonStat[]> {
  const params = new URLSearchParams({
    College: "", Conference: "", Country: "", DateFrom: "", DateTo: "",
    Division: "", DraftPick: "", DraftYear: "", GameScope: "", GameSegment: "",
    Height: "", LastNGames: String(lastNGames), LeagueID: "00", Location: "",
    MeasureType: "Base", Month: "0", OpponentTeamID: "0", Outcome: "",
    PORound: "0", PaceAdjust: "N", PerMode: "PerGame", Period: "0",
    PlayerExperience: "", PlayerPosition: "", PlusMinus: "N", Rank: "N",
    Season: season, SeasonSegment: "", SeasonType: seasonType, ShotClockRange: "",
    StarterBench: "", TeamID: String(teamId), TwoWay: "0", VsConference: "",
    VsDivision: "", Weight: "",
  });
  const url = `${STATS_BASE_URL}/leaguedashplayerstats?${params.toString()}`;
  const data = await nbaFetchJson<LeagueDashResponse>(url, "stats.nba.com", signal);
  const resultSet = data.resultSets?.[0];
  if (!resultSet) throw new Error("stats.nba.com returned no player stats.");

  const players = rowsByHeader(resultSet)
    .filter((row) => num(row, "TEAM_ID") === teamId)
    .map((row) => {
      const stats: Record<string, number | null> = {};
      for (const field of ROSTER_FIELDS) stats[field] = num(row, field);
      return {
        playerId: num(row, "PLAYER_ID") ?? 0,
        playerName: str(row, "PLAYER_NAME") ?? "",
        stats,
      };
    });

  players.sort((a, b) => (b.stats.MIN ?? 0) - (a.stats.MIN ?? 0));
  return players;
}

// ---- Player game log (playergamelog) ----

export interface PlayerGame {
  gameId: string;
  date: string;
  matchup: string;
  outcome: string;
  stats: Record<string, number | null>;
}

const GAMELOG_FIELDS = [
  "MIN", "PTS", "REB", "AST", "STL", "BLK", "TOV",
  "FGM", "FGA", "FG_PCT", "FG3M", "FG3A", "FG3_PCT", "FTM", "FTA", "FT_PCT", "PLUS_MINUS",
];

/** A player's most recent games (newest first), capped at lastNGames. */
export async function getPlayerGameLog(
  playerId: number,
  season: string,
  seasonType: SeasonType,
  lastNGames: number,
  signal?: AbortSignal,
): Promise<PlayerGame[]> {
  const url =
    `${STATS_BASE_URL}/playergamelog?PlayerID=${playerId}&Season=${season}` +
    `&SeasonType=${seasonTypeParam(seasonType)}&LeagueID=00`;
  const data = await nbaFetchJson<LeagueDashResponse>(url, "stats.nba.com", signal);
  const resultSet = data.resultSets?.[0];
  if (!resultSet) throw new Error("stats.nba.com returned no game log.");

  // playergamelog returns newest-first already; take the first lastNGames.
  return rowsByHeader(resultSet)
    .slice(0, lastNGames)
    .map((row) => {
      const stats: Record<string, number | null> = {};
      for (const field of GAMELOG_FIELDS) stats[field] = num(row, field);
      return {
        gameId: str(row, "Game_ID") ?? "",
        date: str(row, "GAME_DATE") ?? "",
        matchup: str(row, "MATCHUP") ?? "",
        outcome: str(row, "WL") ?? "",
        stats,
      };
    });
}

export { DEFAULT_SEASON };
