/**
 * Tool: get_tonight_games — the NBA slate for a given day.
 */
import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { getScheduledGames, type ScheduledGame } from "../nba/schedule.js";
import { ResponseFormat } from "./format.js";

const STATUS_LABEL: Record<number, string> = {
  1: "scheduled",
  2: "in progress",
  3: "final",
};

function formatGame(game: ScheduledGame): string {
  const away = `${game.away.city} ${game.away.name} (${game.away.tricode})`;
  const home = `${game.home.city} ${game.home.name} (${game.home.tricode})`;
  const state = STATUS_LABEL[game.status] ?? "scheduled";
  const score =
    game.status >= 2 ? ` — ${game.away.score}-${game.home.score}` : "";
  const when = game.statusText ? ` [${game.statusText}]` : "";
  return `- ${away} @ ${home}${score} (${state})${when}`;
}

export function registerScheduleTools(server: McpServer): void {
  server.registerTool(
    "get_tonight_games",
    {
      title: "Tonight's NBA games",
      description: `List the NBA games scheduled for a given day, with both teams, status and tip-off time.

The day is resolved in US Eastern time (the league's day boundary). day_offset=0 is today's slate, 1 is tomorrow, -1 is yesterday.

Returns each game's gameId (needed by other tools), the home and away teams with their ids, the game status (scheduled / in progress / final) and the current or final score when the game has started.

Examples:
  - "What games are on tonight?" -> day_offset=0
  - "Who plays tomorrow?" -> day_offset=1`,
      inputSchema: z.strictObject({
        day_offset: z
          .number()
          .int()
          .min(-7)
          .max(7)
          .default(0)
          .describe("Days from today in US Eastern time. 0 = today, 1 = tomorrow, -1 = yesterday."),
        response_format: z
          .enum(ResponseFormat)
          .default(ResponseFormat.MARKDOWN)
          .describe("'markdown' for readable text, 'json' for structured data"),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ day_offset, response_format }, ctx) => {
      const games = await getScheduledGames(day_offset, ctx.mcpReq.signal);

      const payload = {
        day_offset,
        date: games[0]?.date ?? null,
        count: games.length,
        games,
      };

      if (response_format === ResponseFormat.JSON) {
        return {
          content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
          structuredContent: payload,
        };
      }

      if (games.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No NBA games scheduled for day_offset=${day_offset}.`,
            },
          ],
        };
      }

      const header =
        day_offset === 0
          ? "# Tonight's NBA games"
          : `# NBA games (day_offset=${day_offset}, ${payload.date})`;
      const text = [header, `${games.length} game(s).`, "", ...games.map(formatGame)].join("\n");
      return { content: [{ type: "text", text }] };
    },
  );
}
