/**
 * Tool: get_team_stats — one team's per-game aggregates, filterable.
 */
import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { DEFAULT_SEASON } from "../constants.js";
import { getTeamStats, type TeamStatsResult } from "../nba/teamStats.js";
import { teamById, teamLabel } from "../nba/teams.js";
import { ResponseFormat } from "./format.js";

/** Columns surfaced in the Markdown highlight, per measure type. */
const HIGHLIGHT: Record<string, string[]> = {
  Base: ["GP", "W", "L", "PTS", "REB", "AST", "STL", "BLK", "TOV", "FG_PCT", "FG3_PCT", "FG3A", "PLUS_MINUS"],
  Advanced: ["OFF_RATING", "DEF_RATING", "NET_RATING", "PACE", "EFG_PCT", "TS_PCT", "AST_PCT", "AST_TO", "OREB_PCT", "DREB_PCT", "PIE"],
  Defense: ["DEF_RATING", "STL", "BLK", "OPP_PTS_OFF_TOV", "OPP_PTS_2ND_CHANCE", "OPP_PTS_FB", "OPP_PTS_PAINT"],
};

function formatHighlight(result: TeamStatsResult): string {
  const keys = HIGHLIGHT[result.measureType] ?? Object.keys(result.stats);
  const lines = keys
    .filter((k) => k in result.stats)
    .map((k) => `- ${k}: ${result.stats[k] ?? "n/a"}`);

  const f = result.filters;
  const scope: string[] = [`season ${result.season}`, f.seasonType];
  if (f.lastNGames > 0) scope.push(`last ${f.lastNGames} games`);
  if (f.location !== "all") scope.push(f.location === "Home" ? "home only" : "road only");
  if (f.outcome !== "all") scope.push(f.outcome === "W" ? "wins only" : "losses only");
  if (f.opponentTeamId > 0) scope.push(`vs ${teamLabel(f.opponentTeamId)}`);
  if (f.paceAdjust) scope.push("pace-adjusted");

  return [
    `# ${result.teamName} — ${result.measureType} stats`,
    `Scope: ${scope.join(", ")}.`,
    "",
    ...lines,
  ].join("\n");
}

export function registerTeamStatsTools(server: McpServer): void {
  server.registerTool(
    "get_team_stats",
    {
      title: "Team stats",
      description: `Per-game season stats for one NBA team, filterable by recency, venue, opponent, outcome and season type.

Pick a measure_type:
  - "Base": scoring and box-score rates (PTS, REB, AST, FG_PCT, FG3_PCT, ...).
  - "Advanced": efficiency and tempo (OFF_RATING, DEF_RATING, NET_RATING, PACE, TS_PCT, ...).
  - "Defense": opponent-scoring breakdown (DEF_RATING, OPP_PTS_PAINT, OPP_PTS_FB, ...).

team_id is the stats.nba.com team id (e.g. 1610612744 = Golden State Warriors). The structured result returns every column of the team's dashboard row, so each figure is traceable to a named API field.

Examples:
  - "How are the Celtics defending lately?" -> team_id=1610612738, measure_type="Advanced", last_n_games=10
  - "Warriors scoring at home this season" -> team_id=1610612744, measure_type="Base", location="Home"`,
      inputSchema: z.strictObject({
        team_id: z
          .number()
          .int()
          .describe("stats.nba.com team id, e.g. 1610612744 for the Golden State Warriors."),
        measure_type: z
          .enum(["Base", "Advanced", "Defense"])
          .default("Base")
          .describe("Which family of stats to return."),
        season: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .default(DEFAULT_SEASON)
          .describe('Season in "YYYY-YY" form, e.g. "2025-26".'),
        season_type: z
          .enum(["Regular Season", "Playoffs", "Pre Season"])
          .default("Regular Season")
          .describe("Regular Season, Playoffs or Pre Season."),
        last_n_games: z
          .number()
          .int()
          .min(0)
          .max(82)
          .default(0)
          .describe("0 = full season; otherwise restrict to the last N games."),
        location: z
          .enum(["Home", "Road", "all"])
          .default("all")
          .describe("Filter to home games, road games, or all."),
        outcome: z
          .enum(["W", "L", "all"])
          .default("all")
          .describe("Filter to wins, losses, or all."),
        opponent_team_id: z
          .number()
          .int()
          .min(0)
          .default(0)
          .describe("Restrict to games against this opponent team id; 0 = any opponent."),
        pace_adjust: z
          .boolean()
          .default(false)
          .describe("Normalise for pace (possessions) when true."),
        response_format: z
          .enum(ResponseFormat)
          .default(ResponseFormat.MARKDOWN)
          .describe("'markdown' for a readable highlight, 'json' for the full row"),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args, ctx) => {
      if (!teamById(args.team_id)) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Unknown team_id ${args.team_id}. Use a stats.nba.com team id (e.g. 1610612744 = Golden State Warriors).`,
            },
          ],
        };
      }

      const result = await getTeamStats(
        {
          teamId: args.team_id,
          measureType: args.measure_type,
          season: args.season,
          seasonType: args.season_type,
          lastNGames: args.last_n_games,
          location: args.location,
          outcome: args.outcome,
          opponentTeamId: args.opponent_team_id,
          paceAdjust: args.pace_adjust,
        },
        ctx.mcpReq.signal,
      );

      if (args.response_format === ResponseFormat.JSON) {
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      }
      return { content: [{ type: "text", text: formatHighlight(result) }] };
    },
  );
}
