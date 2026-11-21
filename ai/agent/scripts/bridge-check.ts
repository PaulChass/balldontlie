/**
 * Offline self-check for the MCP ↔ Anthropic bridge.
 *
 * Verifies the integration that does NOT need an Anthropic API key: the agent
 * spawns the MCP server, lists its tools, converts them to Anthropic tool
 * definitions, and (optionally) runs one real tool call. The model loop itself
 * is standard SDK usage and needs a key — run it with `npm run ask`.
 *
 * Requires the MCP server to be built first (ai/mcp-server: npm run build).
 * Run with: npm run bridge-check
 */
import { strict as assert } from "node:assert";
import { McpBridge } from "../src/mcpBridge.js";

const EXPECTED_TOOLS = [
  "get_head_to_head",
  "get_injuries",
  "get_last_night_results",
  "get_player_gamelog",
  "get_players_stats",
  "get_team_stats",
  "get_tonight_games",
  "resolve_player",
  "resolve_team",
];

const bridge = new McpBridge();
let warnings = 0;

try {
  await bridge.connect();

  const tools = await bridge.listAnthropicTools();
  assert.deepEqual(
    tools.map((t) => t.name).sort(),
    EXPECTED_TOOLS,
    "bridge did not expose the expected tool set",
  );
  console.error(`✓ bridged ${tools.length} tools`);

  // Each tool must present a JSON-Schema object the Messages API will accept.
  for (const t of tools) {
    const schema = t.input_schema as { type?: string };
    assert.equal(schema.type, "object", `tool ${t.name} has a non-object input_schema`);
    assert.ok(t.description && t.description.length > 0, `tool ${t.name} has no description`);
    // Must be JSON-serialisable (the SDK sends it as JSON).
    JSON.stringify(t.input_schema);
  }
  console.error("✓ every tool schema is an object, described, and JSON-serialisable");

  // One real, read-only tool call end-to-end (local, no API key).
  const resolved = await bridge.callTool("resolve_team", {
    query: "Warriors",
    response_format: "json",
  });
  assert.ok(!resolved.isError, "resolve_team should not error");
  assert.ok(resolved.text.includes("1610612744"), "resolve_team should return the Warriors id");
  console.error("✓ resolve_team round-trip (local, no API key)");

  // The tool cache: an identical call is served from cache, not re-run.
  const before = bridge.getCacheStats().hits;
  const again = await bridge.callTool("resolve_team", { query: "Warriors", response_format: "json" });
  const after = bridge.getCacheStats().hits;
  assert.equal(after, before + 1, "identical tool call should be a cache hit");
  assert.equal(again.text, resolved.text, "cached result should match the first");
  console.error("✓ identical call served from cache");

  // A live-data call is a soft check (a sandbox may not reach stats.nba.com).
  try {
    const live = await bridge.callTool("get_tonight_games", { day_offset: 0, response_format: "json" });
    if (live.isError) {
      warnings++;
      console.error(`  ⚠ get_tonight_games returned a tool error`);
    } else {
      console.error("✓ get_tonight_games round-trip (live data)");
    }
  } catch (error) {
    warnings++;
    console.error(`  ⚠ get_tonight_games: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.error(
    warnings > 0
      ? `\nBridge check passed with ${warnings} warning(s) (live source not reachable here).`
      : "\nBridge check passed.",
  );
} finally {
  await bridge.close();
}
