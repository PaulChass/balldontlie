# balldontlie-nba-mcp-server

An [MCP](https://modelcontextprotocol.io) server that exposes **live, parametrable NBA stats** as tools any MCP client (including Claude) can call. It is the tool layer behind the balldontlie AI agent: the data comes straight from the NBA's own endpoints, so an agent can ground every number it reports in a tool result.

> Built on the data logic of [balldontlie.fr](https://balldontlie.fr). The NBA API calls are ported to TypeScript so this server runs standalone — no PHP/MySQL stack required.

## Tools

| Tool | What it returns | Source |
|------|-----------------|--------|
| `resolve_team` | Team id from a name, city or tricode (local, no network) | static table |
| `resolve_player` | Player id from a name, via the current-season directory (cached) | `stats.nba.com/commonallplayers` |
| `get_tonight_games` | The slate for a given day (teams, status, tip-off, score), US Eastern | `cdn.nba.com` schedule JSON |
| `get_last_night_results` | Final scores from the most recent completed slate | `cdn.nba.com` schedule JSON |
| `get_team_stats` | One team's per-game stats (Base / Advanced / Defense), filterable by last-N games, home/road, opponent, outcome, season type, pace | `stats.nba.com/leaguedashteamstats` |
| `get_players_stats` | A team's full roster, per-game, sorted by minutes | `stats.nba.com/leaguedashplayerstats` |
| `get_player_gamelog` | A player's most recent games with full box-score lines ("last N games") | `stats.nba.com/playergamelog` |
| `get_injuries` | A team's current injury report | `rotowire.com` |
| `get_head_to_head` | Composite matchup brief: season + recent form + advanced profile + season head-to-head split | orchestrates `get_team_stats` |

Stats tools return numbers **keyed by API header name** (team dashboard rows in full), so each figure is traceable to a named field — the foundation for the project's factuality evals.

> `get_game_odds` (ParionsSport FDJ odds, strictly analytical) is planned for the betting-insights milestone and is not in this catalog yet.

## Run

```bash
npm install
npm run build
npm run smoke      # self-check: starts the server, calls the tools, exits non-zero on failure
```

To use it from a stdio MCP client, launch `node dist/index.js`.

## Design notes

- **TypeScript SDK v2** (`@modelcontextprotocol/server`), stdio transport. A Streamable HTTP transport can be added for remote/public hosting.
- Columns are read **by header name**, not by positional index — a column reorder upstream can't silently return the wrong stat.
- The season defaults to the current one (`2026-27`) and is a parameter, not hardcoded. One constant (`DEFAULT_SEASON`), bumped once per offseason — mirrors the PHP app's `App\Nba\Season::CURRENT`.

## Data & terms

This server reads public NBA endpoints (`stats.nba.com`, `cdn.nba.com`) that have no official public API. Requests are sent respectfully (browser-like headers, a request timeout, and — in the agent layer — caching and rate-limiting). Use it within those sites' terms; it is intended for personal, analytical, non-commercial use.
