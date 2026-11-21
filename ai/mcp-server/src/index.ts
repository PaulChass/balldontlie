#!/usr/bin/env node
/**
 * balldontlie NBA MCP server.
 *
 * Exposes live, parametrable NBA stats as MCP tools, sourced from stats.nba.com
 * and the NBA static CDN. Local stdio transport (a host launches it as a
 * subprocess); a Streamable HTTP transport can be added for remote use.
 */
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { registerHeadToHeadTools } from "./tools/headToHead.js";
import { registerInjuryTools } from "./tools/injuries.js";
import { registerPlayerTools } from "./tools/players.js";
import { registerResolveTools } from "./tools/resolve.js";
import { registerResultsTools } from "./tools/results.js";
import { registerScheduleTools } from "./tools/schedule.js";
import { registerTeamStatsTools } from "./tools/teamStats.js";

/** Build a fresh server with every tool registered. Called once per connection. */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "balldontlie-nba-mcp-server",
    version: "0.1.0",
  });

  registerResolveTools(server);
  registerScheduleTools(server);
  registerResultsTools(server);
  registerTeamStatsTools(server);
  registerPlayerTools(server);
  registerInjuryTools(server);
  registerHeadToHeadTools(server);

  return server;
}

serveStdio(createServer);
console.error("balldontlie-nba-mcp-server running on stdio");
