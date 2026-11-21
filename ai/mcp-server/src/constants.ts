/**
 * Shared constants for the balldontlie NBA MCP server.
 */

/**
 * Current NBA season in the "YYYY-YY" format the stats.nba.com API expects.
 * Single source of truth — bump once per offseason (mirrors the PHP app's
 * App\Nba\Season::CURRENT). 2025-26 is a completed season; 2026-27 is live.
 */
export const DEFAULT_SEASON = "2026-27";

/** Upper bound on the size of any single tool response, in characters. */
export const CHARACTER_LIMIT = 25_000;

/** stats.nba.com league-dashboard base (team/player season aggregates). */
export const STATS_BASE_URL = "https://stats.nba.com/stats";

/** NBA static CDN that serves the full-season schedule as JSON. */
export const SCHEDULE_URL =
  "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json";

/**
 * Headers for the cdn.nba.com static JSON. The CDN (Akamai) rejects requests
 * with no browser User-Agent (403), so send a desktop UA and nba.com referer.
 */
export const NBA_CDN_HEADERS: Record<string, string> = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://www.nba.com",
  Referer: "https://www.nba.com/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

/**
 * Browser-like headers stats.nba.com requires. Without an Origin/Referer on
 * nba.com and a desktop User-Agent, the endpoint returns 403 or hangs.
 */
export const NBA_STATS_HEADERS: Record<string, string> = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Connection: "keep-alive",
  Host: "stats.nba.com",
  Origin: "https://www.nba.com",
  Referer: "https://www.nba.com/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "x-nba-stats-origin": "stats",
  "x-nba-stats-token": "true",
};
