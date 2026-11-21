/**
 * Tools: resolve_team and resolve_player — turn a name into the id every other
 * tool needs. resolve_team is local (no network); resolve_player hits the
 * cached current-season directory.
 */
import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { DEFAULT_SEASON } from "../constants.js";
import { resolvePlayer } from "../nba/players.js";
import { TEAMS, type NbaTeam } from "../nba/teams.js";
import { ResponseFormat } from "./format.js";

function matchTeams(query: string): NbaTeam[] {
  const q = query.toLowerCase().trim();
  const scored = TEAMS.map((t) => {
    const haystacks = [t.tricode, t.name, t.city, `${t.city} ${t.name}`].map((s) =>
      s.toLowerCase(),
    );
    let score = 0;
    if (haystacks.some((h) => h === q)) score = 3;
    else if (haystacks.some((h) => h.startsWith(q))) score = 2;
    else if (haystacks.some((h) => h.includes(q))) score = 1;
    return { team: t, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((s) => s.team);
}

export function registerResolveTools(server: McpServer): void {
  server.registerTool(
    "resolve_team",
    {
      title: "Resolve team",
      description: `Find an NBA team's id from a name, city or tricode. Other tools take a team_id, so call this first when you only have a name.

Examples:
  - "Warriors" -> Golden State Warriors, id 1610612744
  - "GSW", "Golden State", "golden state warriors" all resolve the same team`,
      inputSchema: z.strictObject({
        query: z.string().min(2).describe("Team name, city or tricode, e.g. 'Celtics', 'Boston', 'BOS'."),
        response_format: z
          .enum(ResponseFormat)
          .default(ResponseFormat.MARKDOWN)
          .describe("'markdown' or 'json'"),
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ query, response_format }) => {
      const matches = matchTeams(query);
      if (response_format === ResponseFormat.JSON) {
        const payload = { query, count: matches.length, teams: matches };
        return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], structuredContent: payload };
      }
      if (matches.length === 0) {
        return { content: [{ type: "text", text: `No team matches '${query}'.` }] };
      }
      const lines = matches.map((t) => `- ${t.city} ${t.name} (${t.tricode}) — id ${t.id}`);
      return { content: [{ type: "text", text: [`Teams matching '${query}':`, ...lines].join("\n") }] };
    },
  );

  server.registerTool(
    "resolve_player",
    {
      title: "Resolve player",
      description: `Find an NBA player's id from a name, using the current-season directory. Stats tools take a player_id, so call this first when you only have a name.

Returns best matches first, each with the player's id and current team. If several players match, present the options rather than guessing.

Examples:
  - "Curry" -> Stephen Curry (and any other active Curry)
  - "Anthony Edwards" -> exact match first`,
      inputSchema: z.strictObject({
        query: z.string().min(2).describe("Player name or partial name, e.g. 'Curry', 'Anthony Edwards'."),
        season: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .default(DEFAULT_SEASON)
          .describe('Season whose roster to search, "YYYY-YY".'),
        limit: z.number().int().min(1).max(25).default(10).describe("Max matches to return."),
        response_format: z
          .enum(ResponseFormat)
          .default(ResponseFormat.MARKDOWN)
          .describe("'markdown' or 'json'"),
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ query, season, limit, response_format }, ctx) => {
      const matches = (await resolvePlayer(query, season, ctx.mcpReq.signal)).slice(0, limit);
      if (response_format === ResponseFormat.JSON) {
        const payload = { query, count: matches.length, players: matches };
        return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], structuredContent: payload };
      }
      if (matches.length === 0) {
        return { content: [{ type: "text", text: `No active player matches '${query}' in ${season}.` }] };
      }
      const lines = matches.map(
        (p) => `- ${p.name} (${p.teamTricode || "FA"}) — id ${p.id}`,
      );
      return { content: [{ type: "text", text: [`Players matching '${query}':`, ...lines].join("\n") }] };
    },
  );
}
