/**
 * Tools: get_players_stats (a team's roster, per-game) and get_player_gamelog
 * (a player's recent games).
 */
import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { CHARACTER_LIMIT, DEFAULT_SEASON } from "../constants.js";
import {
  getPlayerGameLog,
  getPlayersStats,
  type PlayerGame,
  type PlayerSeasonStat,
} from "../nba/players.js";
import { teamById, teamLabel } from "../nba/teams.js";
import { ResponseFormat } from "./format.js";

function formatRoster(players: PlayerSeasonStat[]): string {
  return players
    .map((p) => {
      const s = p.stats;
      return `- ${p.playerName}: ${s.PTS ?? "–"} pts, ${s.REB ?? "–"} reb, ${s.AST ?? "–"} ast, ${s.MIN ?? "–"} min (${s.GP ?? 0} GP), FG ${s.FG_PCT ?? "–"}, 3P ${s.FG3_PCT ?? "–"}`;
    })
    .join("\n");
}

function formatGameLog(games: PlayerGame[]): string {
  return games
    .map((g) => {
      const s = g.stats;
      return `- ${g.date} ${g.matchup} (${g.outcome}): ${s.PTS ?? "–"} pts, ${s.REB ?? "–"} reb, ${s.AST ?? "–"} ast, 3P ${s.FG3M ?? "–"}/${s.FG3A ?? "–"}, ${s.MIN ?? "–"} min`;
    })
    .join("\n");
}

export function registerPlayerTools(server: McpServer): void {
  server.registerTool(
    "get_players_stats",
    {
      title: "Team roster stats",
      description: `Per-game season stats for every player on a team, sorted by minutes played. Use get_player_gamelog instead for one player's recent games.

team_id is a stats.nba.com team id (resolve_team turns a name into one). Each player row carries PTS, REB, AST, STL, BLK, TOV, MIN, GP, FG_PCT, FG3_PCT, FG3A, FT_PCT and PLUS_MINUS.

Examples:
  - "Who leads the Thunder in scoring?" -> team_id=1610612760
  - "Timberwolves rotation over the last 10 games" -> team_id=1610612750, last_n_games=10`,
      inputSchema: z.strictObject({
        team_id: z.number().int().describe("stats.nba.com team id (see resolve_team)."),
        season: z.string().regex(/^\d{4}-\d{2}$/).default(DEFAULT_SEASON).describe('Season, "YYYY-YY".'),
        season_type: z
          .enum(["Regular Season", "Playoffs", "Pre Season"])
          .default("Regular Season")
          .describe("Regular Season, Playoffs or Pre Season."),
        last_n_games: z.number().int().min(0).max(82).default(0).describe("0 = full season; else last N games."),
        response_format: z.enum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("'markdown' or 'json'"),
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (args, ctx) => {
      if (!teamById(args.team_id)) {
        return { isError: true, content: [{ type: "text", text: `Unknown team_id ${args.team_id}. Use resolve_team.` }] };
      }
      const players = await getPlayersStats(
        args.team_id,
        args.season,
        args.season_type,
        args.last_n_games,
        ctx.mcpReq.signal,
      );
      const payload = {
        team: teamLabel(args.team_id),
        teamId: args.team_id,
        season: args.season,
        count: players.length,
        players,
      };
      if (args.response_format === ResponseFormat.JSON) {
        return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], structuredContent: payload };
      }
      if (players.length === 0) {
        return { content: [{ type: "text", text: `No player stats for ${teamLabel(args.team_id)} with these filters.` }] };
      }
      const text = [`# ${teamLabel(args.team_id)} — player stats (${args.season})`, "", formatRoster(players)].join("\n");
      return { content: [{ type: "text", text }] };
    },
  );

  server.registerTool(
    "get_player_gamelog",
    {
      title: "Player game log",
      description: `A player's most recent games (newest first) with full box-score lines: PTS, REB, AST, STL, BLK, TOV, FG/3P/FT makes-attempts-percentages, minutes and plus-minus.

This is the tool for "last N games" questions. player_id comes from resolve_player.

Examples:
  - "Curry's 3-point shooting over his last 10" -> resolve_player('Curry'), then last_n_games=10
  - "How has Edwards scored recently?" -> last_n_games=5`,
      inputSchema: z.strictObject({
        player_id: z.number().int().describe("stats.nba.com player id (see resolve_player)."),
        season: z.string().regex(/^\d{4}-\d{2}$/).default(DEFAULT_SEASON).describe('Season, "YYYY-YY".'),
        season_type: z
          .enum(["Regular Season", "Playoffs", "Pre Season"])
          .default("Regular Season")
          .describe("Regular Season, Playoffs or Pre Season."),
        last_n_games: z.number().int().min(1).max(82).default(10).describe("How many of the most recent games to return."),
        response_format: z.enum(ResponseFormat).default(ResponseFormat.MARKDOWN).describe("'markdown' or 'json'"),
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (args, ctx) => {
      const games = await getPlayerGameLog(
        args.player_id,
        args.season,
        args.season_type,
        args.last_n_games,
        ctx.mcpReq.signal,
      );
      const payload = { playerId: args.player_id, season: args.season, count: games.length, games };
      if (args.response_format === ResponseFormat.JSON) {
        const text = JSON.stringify(payload, null, 2);
        return { content: [{ type: "text", text }], structuredContent: payload };
      }
      if (games.length === 0) {
        return { content: [{ type: "text", text: `No games found for player ${args.player_id} in ${args.season}.` }] };
      }
      let text = [`# Player ${args.player_id} — last ${games.length} games (${args.season})`, "", formatGameLog(games)].join("\n");
      if (text.length > CHARACTER_LIMIT) text = text.slice(0, CHARACTER_LIMIT);
      return { content: [{ type: "text", text }] };
    },
  );
}
