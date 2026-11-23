<?php

namespace App\Controller;

use App\Security\SessionAuth;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\GuzzleException;
use Psr\Cache\CacheItemPoolInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Web surface for the AI layer.
 *
 * The browser talks only to this controller. This controller proxies to the
 * local Node agent service (the `ai/agent` HTTP service on 127.0.0.1), which
 * holds the Anthropic API key — so the key never reaches the browser. The proxy
 * also caches the expensive previews and throttles the question endpoint.
 *
 * The Node service URL comes from the NBA_AGENT_URL env var (default
 * http://127.0.0.1:8787). If the service is down, the endpoints degrade
 * gracefully with a 503 the front-end turns into a friendly message.
 */
class AssistantController extends AbstractController
{
    private const DEFAULT_AGENT_URL = 'http://127.0.0.1:8787';

    /** Max /ask requests per client IP per 60s window. */
    private const ASK_RATE_LIMIT = 8;

    private const QUESTION_MAX = 500;

    /** Cache previews a touch under the Node service's own 1h TTL. */
    private const PREVIEWS_CACHE_TTL = 3300;

    /** Whole-request timeout: Opus multi-step runs can take a while. */
    private const AGENT_TIMEOUT = 180.0;

    private function agentBaseUrl(): string
    {
        $url = $_ENV['NBA_AGENT_URL'] ?? $_SERVER['NBA_AGENT_URL'] ?? getenv('NBA_AGENT_URL');

        return is_string($url) && $url !== '' ? rtrim($url, '/') : self::DEFAULT_AGENT_URL;
    }

    private function agentClient(): Client
    {
        return new Client([
            'base_uri' => $this->agentBaseUrl() . '/',
            'timeout' => self::AGENT_TIMEOUT,
            'connect_timeout' => 2.0,
            'http_errors' => false, // we passthrough the service's status codes
        ]);
    }

    /**
     * @Route("/assistant", name="assistant", methods={"GET"})
     */
    public function index(): Response
    {
        return $this->render('assistant/index.html.twig');
    }

    /**
     * Natural-language NBA Q&A (usage A). Proxies to the agent /ask endpoint.
     *
     * @Route("/api/nba/ask", name="api_nba_ask", methods={"POST"})
     */
    public function ask(Request $request, CacheItemPoolInterface $cache, SessionAuth $sessionAuth): JsonResponse
    {
        if (!$this->allowRequest($cache, (string) $request->getClientIp())) {
            return $this->json(
                ['error' => 'rate_limited', 'message' => 'Trop de questions d\'affilée. Patiente une minute.'],
                Response::HTTP_TOO_MANY_REQUESTS
            );
        }

        $data = json_decode($request->getContent(), true);
        $question = is_array($data) && isset($data['question']) ? trim((string) $data['question']) : '';

        if ($question === '') {
            return $this->json(['error' => 'empty_question', 'message' => 'Pose une question.'], Response::HTTP_BAD_REQUEST);
        }
        if (mb_strlen($question) > self::QUESTION_MAX) {
            return $this->json(
                ['error' => 'question_too_long', 'message' => 'Question trop longue (500 caractères max).'],
                Response::HTTP_BAD_REQUEST
            );
        }

        // Préférence « Qualité IA » : réservée aux connectés ; sinon mode éco.
        $preferQuality = $sessionAuth->prefersAiQuality();

        $payload = ['question' => $question, 'prefer_quality' => $preferQuality];
        // Contexte de match optionnel : chat scopé à un match du Face-à-Face.
        $match = (is_array($data) && isset($data['match']) && is_array($data['match'])) ? $data['match'] : null;
        if ($match !== null) {
            $payload['match'] = [
                'home_team_id' => (int) ($match['home_team_id'] ?? 0),
                'away_team_id' => (int) ($match['away_team_id'] ?? 0),
                'home_name' => mb_substr(trim((string) ($match['home_name'] ?? '')), 0, 60),
                'away_name' => mb_substr(trim((string) ($match['away_name'] ?? '')), 0, 60),
            ];
        }

        try {
            $response = $this->agentClient()->post('ask', [
                'json' => $payload,
            ]);
        } catch (ConnectException $e) {
            return $this->serviceUnavailable();
        } catch (GuzzleException $e) {
            return $this->json(
                ['error' => 'proxy_error', 'message' => 'L\'assistant est momentanément indisponible.'],
                Response::HTTP_BAD_GATEWAY
            );
        }

        return $this->passthrough($response);
    }

    /**
     * Grounded pre-game previews for the slate (usage B). Cached server-side.
     *
     * @Route("/api/nba/previews", name="api_nba_previews", methods={"GET"})
     */
    public function previews(Request $request, CacheItemPoolInterface $cache, SessionAuth $sessionAuth): JsonResponse
    {
        $day = max(0, min(1, (int) $request->query->get('day', 0)));
        $limit = max(1, min(6, (int) $request->query->get('limit', 2)));
        // Préférence « Qualité IA » : des avant-matchs en mode qualité (modèle plus
        // capable) sont mis en cache séparément du mode éco, par connecté.
        $preferQuality = $sessionAuth->prefersAiQuality();
        $cacheKey = sprintf('nba_previews_%d_%d_%s', $day, $limit, $preferQuality ? 'q' : 'e');

        $item = $cache->getItem($cacheKey);
        if ($item->isHit()) {
            return new JsonResponse($item->get(), Response::HTTP_OK, [], true);
        }

        try {
            $response = $this->agentClient()->get('previews', [
                'query' => ['day' => $day, 'limit' => $limit, 'quality' => $preferQuality ? 1 : 0],
            ]);
        } catch (ConnectException $e) {
            return $this->serviceUnavailable();
        } catch (GuzzleException $e) {
            return $this->json(
                ['error' => 'proxy_error', 'message' => 'Les avant-matchs sont momentanément indisponibles.'],
                Response::HTTP_BAD_GATEWAY
            );
        }

        $status = $response->getStatusCode();
        $body = (string) $response->getBody();

        // Only cache a genuine success, so a transient failure isn't frozen in.
        if ($status === Response::HTTP_OK) {
            $item->set($body);
            $item->expiresAfter(self::PREVIEWS_CACHE_TTL);
            $cache->save($item);
        }

        return new JsonResponse($body, $status, [], true);
    }

    /**
     * On-demand grounded debrief for a single matchup (Face-à-Face « Proba & IA »
     * tab). Proxies to the agent, cached server-side per team pair + quality.
     *
     * @Route("/api/nba/match-preview", name="api_nba_match_preview", methods={"GET"})
     */
    public function matchPreview(Request $request, CacheItemPoolInterface $cache, SessionAuth $sessionAuth): JsonResponse
    {
        $homeTeamId = (int) $request->query->get('home_team_id', 0);
        $awayTeamId = (int) $request->query->get('away_team_id', 0);
        if ($homeTeamId <= 0 || $awayTeamId <= 0) {
            return $this->json(
                ['error' => 'bad_match', 'message' => 'Match invalide.'],
                Response::HTTP_BAD_REQUEST
            );
        }
        $homeName = mb_substr(trim((string) $request->query->get('home_name', '')), 0, 60);
        $awayName = mb_substr(trim((string) $request->query->get('away_name', '')), 0, 60);

        // Préférence « Qualité IA » : debrief sur un modèle plus capable, cache séparé.
        $preferQuality = $sessionAuth->prefersAiQuality();
        $cacheKey = sprintf('nba_match_preview_%d_%d_%s', $homeTeamId, $awayTeamId, $preferQuality ? 'q' : 'e');

        $item = $cache->getItem($cacheKey);
        if ($item->isHit()) {
            return new JsonResponse($item->get(), Response::HTTP_OK, [], true);
        }

        try {
            $response = $this->agentClient()->get('match-preview', [
                'query' => [
                    'home_team_id' => $homeTeamId,
                    'away_team_id' => $awayTeamId,
                    'home_name' => $homeName,
                    'away_name' => $awayName,
                    'quality' => $preferQuality ? 1 : 0,
                ],
            ]);
        } catch (ConnectException $e) {
            return $this->serviceUnavailable();
        } catch (GuzzleException $e) {
            return $this->json(
                ['error' => 'proxy_error', 'message' => 'Le debrief est momentanément indisponible.'],
                Response::HTTP_BAD_GATEWAY
            );
        }

        $status = $response->getStatusCode();
        $body = (string) $response->getBody();

        if ($status === Response::HTTP_OK) {
            $item->set($body);
            $item->expiresAfter(self::PREVIEWS_CACHE_TTL);
            $cache->save($item);
        }

        return new JsonResponse($body, $status, [], true);
    }

    /** Fixed-window per-IP throttle backed by the app cache. */
    private function allowRequest(CacheItemPoolInterface $cache, string $ip): bool
    {
        $window = (int) floor(time() / 60);
        $item = $cache->getItem(sprintf('nba_ask_rl_%s_%d', md5($ip), $window));
        $count = $item->isHit() ? (int) $item->get() : 0;
        if ($count >= self::ASK_RATE_LIMIT) {
            return false;
        }
        $item->set($count + 1);
        $item->expiresAfter(60);
        $cache->save($item);

        return true;
    }

    private function serviceUnavailable(): JsonResponse
    {
        return $this->json(
            ['error' => 'service_unavailable', 'message' => 'L\'assistant IA n\'est pas démarré. Réessaie plus tard.'],
            Response::HTTP_SERVICE_UNAVAILABLE
        );
    }

    /** Return the agent service's JSON body and status code unchanged. */
    private function passthrough(\Psr\Http\Message\ResponseInterface $response): JsonResponse
    {
        return new JsonResponse((string) $response->getBody(), $response->getStatusCode(), [], true);
    }
}
