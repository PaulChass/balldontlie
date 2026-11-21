/**
 * Tool: get_head_to_head — a composite matchup brief for two teams.
 *
 * A workflow tool: it orchestrates several get_team_stats queries (full-season
 * form, recent form, and the season head-to-head split) so an agent can build a
 * grounded preview from one call. Every number still comes from a team row.
 */
import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { DEFAULT_SEASON } from "../constants.js";
import { getTeamStats, type SeasonType, type TeamStatsResult } from "../nba/teamStats.js";
import { teamById, teamLabel } from "../nba/teams.js";
import { ResponseFormat } from "./format.js";

interface TeamBrief {
  teamId: number;
  team: string;
  season: TeamStatsResult["stats"];
  recentForm: TeamStatsResult["stats"];
  advanced: TeamStatsResult["stats"];
}

function brief(
  teamId: number,
  season: TeamStatsResult,
  form: TeamStatsResult,
  adv: TeamStatsResult,
): TeamBrief {
  return {
    teamId,
    team: teamLabel(teamId),
    season: season.stats,
    recentForm: form.stats,
    advanced: adv.stats,
  };
}

function line(label: string, stats: TeamStatsResult["stats"]): string {
  return `${label}: ${stats.W ?? "?"}-${stats.L ?? "?"}, ${stats.PTS ?? "?"} PTS, NET ${stats.NET_RATING ?? "n/a"}`;
}

export function registerHeadToHeadTools(server: McpServer): void {
  server.registerTool(
    "get_head_to_head",
    {
      title: "Head-to-head matchup brief",
      description: `A grounded matchup brief for two teams: each team's full-season record and scoring, their recent form over the last N games, their advanced profile (NET_RATING, PACE), and their season head-to-head split.

Use this to prepare a preview of a specific game. home_team_id and away_team_id come from resolve_team or get_tonight_games. All figures trace back to team dashboard rows.

Example:
  - "Preview Celtics vs Knicks" -> home_team_id=1610612738, away_team_id=1610612752`,
      inputSchema: z.strictObject({
        home_team_id: z.number().int().describe("Home team's stats.nba.com id."),
        away_team_id: z.number().int().describe("Away team's stats.nba.com id."),
        season: z.string().regex(/^\d{4}-\d{2}$/).default(DEFAULT_SEASON).describe('Season, "YYYY-YY".'),
        season_type: z
          .enum(["Regular Season", "Playoffs", "Pre Season"])
          .default("Regular Season")
          .describe("Regular Season, Playoffs or Pre Season."),
        recent_form_games: z.number().int().min(1).max(30).default(10).describe("Window for 'recent form'."),
        response_format: z.enum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("'markdown' or 'json'"),
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (args, ctx) => {
      for (const id of [args.home_team_id, args.away_team_id]) {
        if (!teamById(id)) {
          return { isError: true, content: [{ type: "text", text: `Unknown team_id ${id}. Use resolve_team.` }] };
        }
      }
      const signal = ctx.mcpReq.signal;
      const base = (teamId: number, lastN: number, measure: "Base" | "Advanced", opponent = 0) =>
        getTeamStats(
          {
            teamId,
            measureType: measure,
            season: args.season,
            seasonType: args.season_type,
            lastNGames: lastN,
            location: "all",
            outcome: "all",
            opponentTeamId: opponent,
            paceAdjust: false,
          },
          signal,
        );

      const [hSeason, hForm, hAdv, aSeason, aForm, aAdv, h2h] = await Promise.all([
        base(args.home_team_id, 0, "Base"),
        base(args.home_team_id, args.recent_form_games, "Base"),
        base(args.home_team_id, 0, "Advanced"),
        base(args.away_team_id, 0, "Base"),
        base(args.away_team_id, args.recent_form_games, "Base"),
        base(args.away_team_id, 0, "Advanced"),
        base(args.home_team_id, 0, "Base", args.away_team_id),
      ]);

      const payload = {
        season: args.season,
        recentFormGames: args.recent_form_games,
        home: brief(args.home_team_id, hSeason, hForm, hAdv),
        away: brief(args.away_team_id, aSeason, aForm, aAdv),
        headToHead: {
          description: `${teamLabel(args.home_team_id)} vs ${teamLabel(args.away_team_id)} this season`,
          games: h2h.stats.GP ?? 0,
          homeWins: h2h.stats.W ?? 0,
          homeLosses: h2h.stats.L ?? 0,
          homePointsPerGame: h2h.stats.PTS ?? null,
        },
      };

      if (args.response_format === ResponseFormat.JSON) {
        return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], structuredContent: payload };
      }

      const text = [
        `# ${teamLabel(args.away_team_id)} @ ${teamLabel(args.home_team_id)}`,
        `Season ${args.season}, recent form = last ${args.recent_form_games} games.`,
        "",
        `## ${payload.home.team} (home)`,
        `- ${line("Season", hSeason.stats)}`,
        `- ${line(`Last ${args.recent_form_games}`, hForm.stats)}`,
        "",
        `## ${payload.away.team} (away)`,
        `- ${line("Season", aSeason.stats)}`,
        `- ${line(`Last ${args.recent_form_games}`, aForm.stats)}`,
        "",
        `## Head-to-head (${args.season})`,
        `- ${payload.headToHead.games} meeting(s); ${payload.home.team} ${payload.headToHead.homeWins}-${payload.headToHead.homeLosses}, ${payload.headToHead.homePointsPerGame ?? "?"} PTS/game.`,
      ].join("\n");
      return { content: [{ type: "text", text }] };
    },
  );
}
