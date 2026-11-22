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

/** Desktop Chrome User-Agent (kept in sync with the sec-ch-ua version below). */
const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Modern Chrome client-hint + fetch-metadata headers. cdn.nba.com's Akamai bot
 * rules return 403 to requests that carry only a User-Agent and Referer; sending
 * the full set a real browser XHR sends (sec-ch-ua*, sec-fetch-*, a wildcard
 * Accept) is what flips the response to 200 — verified from the production IP.
 */
const CHROME_FETCH_HINTS: Record<string, string> = {
  "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
};

/**
 * Headers for the cdn.nba.com static JSON. The CDN (Akamai) rejects requests
 * that look non-browser (403), so we mirror a real Chrome XHR: desktop UA,
 * nba.com origin/referer, and the client-hint / fetch-metadata header set.
 */
export const NBA_CDN_HEADERS: Record<string, string> = {
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://www.nba.com",
  Referer: "https://www.nba.com/",
  "User-Agent": CHROME_UA,
  ...CHROME_FETCH_HINTS,
};

/**
 * Browser-like headers stats.nba.com requires. Without an Origin/Referer on
 * nba.com, a desktop User-Agent and the same client-hint / fetch-metadata set,
 * the endpoint returns 403 or hangs. The x-nba-stats-* pair is specific to the
 * stats API. (No explicit Host: undici derives the :authority from the URL.)
 */
export const NBA_STATS_HEADERS: Record<string, string> = {
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  Connection: "keep-alive",
  Origin: "https://www.nba.com",
  Referer: "https://www.nba.com/",
  "User-Agent": CHROME_UA,
  "x-nba-stats-origin": "stats",
  "x-nba-stats-token": "true",
  ...CHROME_FETCH_HINTS,
};
