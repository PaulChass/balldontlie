/**
 * Usage B — auto-generated, grounded previews of tonight's games.
 *
 * For each game on the slate, the agent is run with a preview-specific system
 * prompt that keeps the factuality contract but asks for a short briefing
 * structure. It calls get_head_to_head (season + recent form + advanced profile
 * + h2h split) and get_injuries, so every figure traces to a tool result — and
 * the briefing is then run through the same grounding check as the eval.
 */
import { runAgent, type AgentResult } from "../agent.js";
import { checkGrounding, type GroundingReport } from "../eval/grounding.js";
import type { McpBridge } from "../mcpBridge.js";
import type { ModelSpec } from "../models.js";

export interface GameTeamRef {
  teamId: number;
  tricode: string;
  city: string;
  name: string;
  score: number;
}

export interface GameRef {
  gameId: string;
  date: string;
  status: number;
  statusText: string;
  home: GameTeamRef;
  away: GameTeamRef;
}

/** Read the slate for a day as structured games (via the MCP tool, JSON mode). */
export async function getSlate(bridge: McpBridge, dayOffset = 0): Promise<GameRef[]> {
  const { text, isError } = await bridge.callTool("get_tonight_games", {
    day_offset: dayOffset,
    response_format: "json",
  });
  if (isError) throw new Error(`get_tonight_games failed: ${text}`);
  const payload = JSON.parse(text) as { games?: GameRef[] };
  return payload.games ?? [];
}

const PREVIEW_SYSTEM = `Tu es analyste NBA pour balldontlie. Tu rédiges un AVANT-MATCH court et fondé pour UN match donné.

Règles de factualité (strictes) :
- Chaque chiffre — bilan, points par match, net rating, pace, pourcentage, blessé — doit provenir d'un résultat d'outil de CETTE conversation. Jamais de mémoire, jamais d'estimation.
- Appelle get_head_to_head avec les home_team_id et away_team_id fournis (forme de saison, forme récente, profil avancé, confrontation directe), puis get_injuries pour CHAQUE équipe. Si une donnée manque, dis-le au lieu de l'inventer.

Format (markdown, ~180-250 mots, en français) :
# {Équipe extérieure} @ {Équipe à domicile}
**Forme** — une ligne par équipe : bilan (V-D), points/match, net rating, et forme sur les N derniers matchs.
**Clés** — 2 ou 3 différenciateurs chiffrés (écart de net rating, pace, adresse…).
**Confrontation** — le bilan de la confrontation directe cette saison, ou « pas encore joué cette saison ».
**Blessés** — les absents de chaque équipe, ou « aucun signalé ».
**À suivre** — 1 ou 2 angles analytiques tirés des chiffres.

Ton : analytique et sobre. Pour tout angle de type cote/pari, reste STRICTEMENT descriptif (« ce que disent les chiffres ») — jamais d'incitation à parier, jamais de conseil de mise, jamais un pronostic présenté comme une certitude.`;

export interface PreviewResult {
  game: GameRef;
  title: string;
  briefing: string;
  grounding: GroundingReport;
  agent: AgentResult;
}

export async function generatePreview(
  bridge: McpBridge,
  game: GameRef,
  model: ModelSpec,
): Promise<PreviewResult> {
  const away = `${game.away.city} ${game.away.name}`.trim();
  const home = `${game.home.city} ${game.home.name}`.trim();
  const question =
    `Prépare l'avant-match de ce soir : ${away} (${game.away.tricode}) en déplacement chez ${home} (${game.home.tricode}). ` +
    `Utilise home_team_id=${game.home.teamId} et away_team_id=${game.away.teamId}.`;

  const agent = await runAgent({
    question,
    bridge,
    model,
    systemPrompt: PREVIEW_SYSTEM,
    maxTokens: 16000,
  });

  const corpus = agent.toolCalls.map((t) => t.resultText).join("\n");
  const grounding = checkGrounding(agent.answer, corpus);

  return { game, title: `${away} @ ${home}`, briefing: agent.answer, grounding, agent };
}

export { PREVIEW_SYSTEM };
