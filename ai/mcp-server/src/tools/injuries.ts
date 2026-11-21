/**
 * Tool: get_injuries — a team's current injury report.
 */
import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { getInjuries } from "../nba/injuries.js";
import { teamById, teamLabel } from "../nba/teams.js";
import { ResponseFormat } from "./format.js";

export function registerInjuryTools(server: McpServer): void {
  server.registerTool(
    "get_injuries",
    {
      title: "Team injuries",
      description: `Current injury report for one NBA team: each listed player with their injury and status (out, questionable, probable, ...). Source: Rotowire.

Use this to factor availability into a matchup preview. team_id comes from resolve_team.

Examples:
  - "Who's hurt on the Lakers?" -> team_id=1610612747`,
      inputSchema: z.strictObject({
        team_id: z.number().int().describe("stats.nba.com team id (see resolve_team)."),
        response_format: z.enum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("'markdown' or 'json'"),
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ team_id, response_format }, ctx) => {
      if (!teamById(team_id)) {
        return { isError: true, content: [{ type: "text", text: `Unknown team_id ${team_id}. Use resolve_team.` }] };
      }
      const injuries = await getInjuries(team_id, ctx.mcpReq.signal);
      const payload = { team: teamLabel(team_id), teamId: team_id, count: injuries.length, injuries };
      if (response_format === ResponseFormat.JSON) {
        return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], structuredContent: payload };
      }
      if (injuries.length === 0) {
        return { content: [{ type: "text", text: `No injuries listed for ${teamLabel(team_id)}.` }] };
      }
      const lines = injuries.map((i) => `- ${i.player}: ${i.status}${i.injury ? ` (${i.injury})` : ""}`);
      return { content: [{ type: "text", text: [`# ${teamLabel(team_id)} — injury report`, "", ...lines].join("\n") }] };
    },
  );
}
