<?php

namespace App\Nba;

use Psr\Cache\CacheItemPoolInterface;

/**
 * Client HTTP minimal et robuste pour les sources de données NBA (cURL).
 *
 * Centralise des timeouts raisonnables, la gestion d'erreur (retourne null au
 * lieu de laisser planter l'appelant quand l'API ne répond pas) et un cache
 * optionnel pour les ressources coûteuses ou peu changeantes (ex. le calendrier
 * complet de la saison, téléchargé à chaque affichage de la page d'accueil).
 */
class NbaClient
{
    /** En-têtes attendus par les endpoints stats.nba.com. */
    public const STATS_HEADERS = [
        'Host: stats.nba.com',
        'Connection: keep-alive',
        'Accept: application/json, text/plain, */*',
        'x-nba-stats-token: true',
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'x-nba-stats-origin: stats',
        'Origin: https://www.nba.com',
        'Referer: https://www.nba.com/',
        'Accept-Language: en-US,en;q=0.9',
    ];

    private ?CacheItemPoolInterface $cache;

    public function __construct(?CacheItemPoolInterface $cache = null)
    {
        $this->cache = $cache;
    }

    /**
     * Récupère une URL et décode le JSON.
     *
     * @return object|null null en cas d'échec réseau, d'erreur HTTP ou de JSON invalide
     */
    public function getJson(string $url, array $headers = [], int $timeout = 10): ?object
    {
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'GET',
            CURLOPT_HTTPHEADER => $headers,
        ]);

        $response = curl_exec($curl);
        $httpCode = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        if ($response === false || $httpCode >= 400) {
            return null;
        }

        $decoded = json_decode((string) $response);

        return $decoded instanceof \stdClass ? $decoded : null;
    }

    /**
     * Comme getJson(), mais met le résultat en cache pendant $ttl secondes.
     * Dégrade proprement vers un appel direct si aucun cache n'est disponible.
     */
    public function getJsonCached(string $cacheKey, string $url, array $headers = [], int $ttl = 300, int $timeout = 10): ?object
    {
        if ($this->cache === null) {
            return $this->getJson($url, $headers, $timeout);
        }

        $item = $this->cache->getItem($cacheKey);
        if ($item->isHit()) {
            return $item->get();
        }

        $data = $this->getJson($url, $headers, $timeout);
        if ($data !== null) {
            $item->set($data);
            $item->expiresAfter($ttl);
            $this->cache->save($item);
        }

        return $data;
    }
}
