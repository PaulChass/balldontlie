/**
 * Tool: get_last_night_results — the most recent completed NBA slate.
 */
import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { getRecentResults, type ScheduledGame } from "../nba/schedule.js";
import { ResponseFormat } from "./format.js";

function formatFinal(game: ScheduledGame): string {
  const away = `${game.away.city} ${game.away.name}`;
  const home = `${game.home.city} ${game.home.name}`;
  return `- ${away} ${game.away.score} @ ${home} ${game.home.score}`;
}

export function registerResultsTools(server: McpServer): void {
  server.registerTool(
    "get_last_night_results",
    {
      title: "Last night's results",
      description: `Final scores from the most recent completed NBA slate (today or the latest earlier day with finished games), resolved in US Eastern time.

Returns each finished game with both teams and the final score.

Examples:
  - "What were last night's scores?"
  - "Did the Nuggets win?"`,
      inputSchema: z.strictObject({
        max_days_back: z
          .number()
          .int()
          .min(1)
          .max(10)
          .default(3)
          .describe("How many days back to look for the most recent finished slate."),
        response_format: z.enum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("'markdown' or 'json'"),
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ max_days_back, response_format }, ctx) => {
      const games = await getRecentResults(max_days_back, ctx.mcpReq.signal);
      const payload = { date: games[0]?.date ?? null, count: games.length, games };
      if (response_format === ResponseFormat.JSON) {
        return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], structuredContent: payload };
      }
      if (games.length === 0) {
        return { content: [{ type: "text", text: `No finished games found in the last ${max_days_back} days.` }] };
      }
      const text = [`# Results — ${payload.date}`, `${games.length} game(s).`, "", ...games.map(formatFinal)].join("\n");
      return { content: [{ type: "text", text }] };
    },
  );
}
