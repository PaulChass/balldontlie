/**
 * Self-check for the balldontlie NBA MCP server.
 *
 * Starts the built server over stdio, exercises its tools as a client would,
 * and exits non-zero on any wiring failure. Live NBA calls are attempted but
 * treated as soft (a sandbox may not reach stats.nba.com / cdn.nba.com): a
 * network failure prints a warning, it does not fail the check.
 *
 * Run with: npm run build && npm run smoke
 */
import { strict as assert } from "node:assert";
import { Client } from "@modelcontextprotocol/client";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/client/stdio";

interface ToolResult {
  isError?: boolean;
  content: { type: string; text?: string }[];
  structuredContent?: unknown;
}

const WARRIORS = 1610612744;
const CELTICS = 1610612738;

const client = new Client({ name: "smoke-test", version: "1.0.0" });
await client.connect(
  new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"],
    env: { ...getDefaultEnvironment() },
  }),
);

let warnings = 0;
const warn = (msg: string) => {
  warnings++;
  console.error(`  ⚠ ${msg}`);
};

const call = (name: string, args: Record<string, unknown>) =>
  client.callTool({ name, arguments: args }) as Promise<ToolResult>;

// 1. All tools are registered with the expected names.
const { tools } = await client.listTools();
assert.deepEqual(
  tools.map((t) => t.name).sort(),
  [
    "get_head_to_head",
    "get_injuries",
    "get_last_night_results",
    "get_player_gamelog",
    "get_players_stats",
    "get_team_stats",
    "get_tonight_games",
    "resolve_player",
    "resolve_team",
  ],
  "unexpected tool list",
);
console.error(`✓ tool list (${tools.length} tools)`);

// 2. Invalid input is rejected as a tool error.
const badTeam = await call("get_team_stats", { team_id: 123 });
assert.equal(badTeam.isError, true, "unknown team_id should be a tool error");
console.error("✓ invalid-input rejection");

// 3. resolve_team is local — must work with no network.
const gsw = await call("resolve_team", { query: "Warriors", response_format: "json" });
assert.ok(!gsw.isError, "resolve_team should not error");
const teamMatch = (gsw.structuredContent as { teams: { id: number }[] }).teams[0];
assert.equal(teamMatch.id, WARRIORS, "Warriors should resolve to its id");
console.error("✓ resolve_team (local)");

// ---- Live soft checks ----

const live = async (label: string, run: () => Promise<void>) => {
  try {
    await run();
  } catch (error) {
    warn(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

await live("get_tonight_games", async () => {
  const r = await call("get_tonight_games", { day_offset: 0, response_format: "json" });
  if (r.isError) return warn(`get_tonight_games: ${r.content[0]?.text}`);
  const p = r.structuredContent as { count: number };
  console.error(`✓ get_tonight_games (live): ${p.count} game(s)`);
});

await live("get_last_night_results", async () => {
  const r = await call("get_last_night_results", { response_format: "json" });
  if (r.isError) return warn(`get_last_night_results: ${r.content[0]?.text}`);
  const p = r.structuredContent as { count: number; date: string | null };
  console.error(`✓ get_last_night_results (live): ${p.count} final(s) on ${p.date}`);
});

await live("get_team_stats", async () => {
  const r = await call("get_team_stats", { team_id: WARRIORS, measure_type: "Advanced", response_format: "json" });
  if (r.isError) return warn(`get_team_stats: ${r.content[0]?.text}`);
  const p = r.structuredContent as { teamName: string; stats: Record<string, unknown> };
  console.error(`✓ get_team_stats (live): ${p.teamName}, NET_RATING=${p.stats.NET_RATING}`);
});

await live("resolve_player + get_player_gamelog", async () => {
  const resolved = await call("resolve_player", { query: "Curry", response_format: "json" });
  if (resolved.isError) return warn(`resolve_player: ${resolved.content[0]?.text}`);
  const players = (resolved.structuredContent as { players: { id: number; name: string }[] }).players;
  if (players.length === 0) return warn("resolve_player returned no match for 'Curry'");
  console.error(`✓ resolve_player (live): ${players[0].name} -> ${players[0].id}`);

  const log = await call("get_player_gamelog", { player_id: players[0].id, last_n_games: 5, response_format: "json" });
  if (log.isError) return warn(`get_player_gamelog: ${log.content[0]?.text}`);
  const p = log.structuredContent as { count: number };
  console.error(`✓ get_player_gamelog (live): ${p.count} game(s)`);
});

await live("get_head_to_head", async () => {
  const r = await call("get_head_to_head", { home_team_id: CELTICS, away_team_id: WARRIORS, response_format: "json" });
  if (r.isError) return warn(`get_head_to_head: ${r.content[0]?.text}`);
  const p = r.structuredContent as { headToHead: { games: number } };
  console.error(`✓ get_head_to_head (live): ${p.headToHead.games} meeting(s)`);
});

await live("get_injuries", async () => {
  const r = await call("get_injuries", { team_id: WARRIORS, response_format: "json" });
  if (r.isError) return warn(`get_injuries: ${r.content[0]?.text}`);
  const p = r.structuredContent as { count: number };
  console.error(`✓ get_injuries (live): ${p.count} listed`);
});

await client.close();

if (warnings > 0) {
  console.error(`\nSmoke test passed with ${warnings} warning(s) (some live sources not reachable here).`);
} else {
  console.error("\nSmoke test passed.");
}
