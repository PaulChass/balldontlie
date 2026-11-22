<?php

namespace App\Services;

/**
 * Estimation de la probabilité de victoire d'un match NBA.
 *
 * Modèle (volontairement simple et explicable, pas une « simulation ») :
 *   1. Force de chaque équipe = Net Rating de la saison (points marqués − encaissés
 *      pour 100 possessions), déjà fourni par les stats avancées NBA.
 *   2. Écart de points attendu = (NetDom − NetExt) ramené au rythme (pace) du match,
 *      + avantage du terrain, − impact des blessés de chaque équipe.
 *   3. Conversion de l'écart attendu en probabilité via la loi normale
 *      (l'écart réel d'un match NBA suit approximativement une normale, σ ≈ 12 pts).
 *
 * Les méthodes de calcul sont pures (sans réseau) pour être testées unitairement ;
 * estimate() fait les appels à StatsManager et assemble le détail affiché à l'utilisateur.
 */
class WinProbability
{
    /** Avantage du terrain, en points (valeur classique en NBA ~2,5–3 pts). */
    public const HOME_ADVANTAGE = 2.7;

    /** Écart-type de la marge d'un match NBA, en points (pour la conversion en proba). */
    public const SIGMA = 12.0;

    /** Rythme par défaut si le pace est indisponible (possessions / 48 min). */
    public const DEFAULT_PACE = 100.0;

    /**
     * Amortissement de l'impact d'un blessé : un joueur absent n'enlève pas tous ses
     * points à l'équipe (un remplaçant compense en partie). ~0,5 de ses points/match.
     */
    public const INJURY_DAMPING = 0.5;

    /** Plafond de l'impact cumulé des blessés d'une équipe, en points. */
    public const INJURY_CAP = 12.0;

    /** Impact forfaitaire quand un blessé n'est pas retrouvé dans les stats joueurs. */
    public const INJURY_FALLBACK_POINTS = 6.0;

    private StatsManager $statsManager;

    public function __construct(StatsManager $statsManager)
    {
        $this->statsManager = $statsManager;
    }

    /**
     * Fonction d'erreur (approximation Abramowitz & Stegun 7.1.26, |erreur| < 1,5e-7).
     */
    public static function erf(float $x): float
    {
        $sign = $x < 0 ? -1.0 : 1.0;
        $x = abs($x);
        $t = 1.0 / (1.0 + 0.3275911 * $x);
        $y = 1.0 - ((((( 1.061405429 * $t - 1.453152027) * $t) + 1.421413741) * $t - 0.284496736) * $t + 0.254829592) * $t * exp(-$x * $x);
        return $sign * $y;
    }

    /** Fonction de répartition de la loi normale centrée réduite. */
    public static function normalCdf(float $z): float
    {
        return 0.5 * (1.0 + self::erf($z / sqrt(2.0)));
    }

    /** Nombre de possessions attendu dans le match (moyenne des deux rythmes). */
    public static function possessions(float $paceHome, float $paceAway): float
    {
        $paceHome = $paceHome > 0 ? $paceHome : self::DEFAULT_PACE;
        $paceAway = $paceAway > 0 ? $paceAway : self::DEFAULT_PACE;
        return ($paceHome + $paceAway) / 2.0;
    }

    /**
     * Écart de points attendu (positif = en faveur du domicile).
     */
    public static function expectedMargin(
        float $netHome,
        float $netAway,
        float $possessions,
        float $injuryHome,
        float $injuryAway,
        float $homeAdvantage = self::HOME_ADVANTAGE
    ): float {
        $baseMargin = ($netHome - $netAway) * $possessions / 100.0;
        // Les blessés du domicile pénalisent le domicile ; ceux de l'extérieur l'avantagent.
        return $baseMargin + $homeAdvantage - $injuryHome + $injuryAway;
    }

    /** Marge attendue → probabilité de victoire du domicile. */
    public static function marginToProbability(float $margin, float $sigma = self::SIGMA): float
    {
        return self::normalCdf($margin / $sigma);
    }

    /**
     * Poids d'un statut d'indisponibilité (1 = absent certain, 0 = joue).
     */
    public static function statusWeight(string $status): float
    {
        $s = strtolower($status);
        if (str_contains($s, 'out')) {
            return 1.0;
        }
        if (str_contains($s, 'doubtful')) {
            return 0.75;
        }
        if (str_contains($s, 'question') || str_contains($s, 'gtd') || str_contains($s, 'game time')) {
            return 0.4;
        }
        if (str_contains($s, 'probable')) {
            return 0.15;
        }
        return 0.0;
    }

    /**
     * Impact en points d'un joueur absent : ses points/match, amortis et pondérés
     * par la probabilité qu'il manque réellement.
     */
    public static function playerImpact(float $pointsPerGame, string $status): float
    {
        return $pointsPerGame * self::INJURY_DAMPING * self::statusWeight($status);
    }

    /** Normalise un nom pour comparer blessés (rotowire) et stats joueurs (NBA). */
    public static function normalizeName(string $name): string
    {
        $name = strtolower(trim($name));
        // Retire les accents.
        $translit = @iconv('UTF-8', 'ASCII//TRANSLIT', $name);
        if ($translit !== false) {
            $name = $translit;
        }
        // Ne garde que les lettres et chiffres.
        return preg_replace('/[^a-z0-9]/', '', $name) ?? '';
    }

    /**
     * Calcule l'impact total des blessés d'une équipe et le détail par joueur.
     *
     * @param array<int,array{player:string,injury?:string,status:string}> $injuries
     * @param array<int,array{name:string,points:float|int}> $players
     * @return array{impact:float,players:array<int,array{player:string,status:string,impact:float}>}
     */
    public static function teamInjuryImpact(array $injuries, array $players): array
    {
        $byName = [];
        foreach ($players as $p) {
            $byName[self::normalizeName((string) ($p['name'] ?? ''))] = (float) ($p['points'] ?? 0);
        }

        $total = 0.0;
        $detail = [];
        foreach ($injuries as $inj) {
            $status = (string) ($inj['status'] ?? '');
            $weight = self::statusWeight($status);
            if ($weight <= 0.0) {
                continue; // Probable / disponible : on ignore.
            }
            $key = self::normalizeName((string) ($inj['player'] ?? ''));
            if ($key !== '' && isset($byName[$key])) {
                $impact = self::playerImpact($byName[$key], $status);
            } else {
                // Joueur non retrouvé dans les stats : impact forfaitaire prudent.
                $impact = self::INJURY_FALLBACK_POINTS * self::INJURY_DAMPING * $weight;
            }
            if ($impact <= 0.0) {
                continue;
            }
            $total += $impact;
            $detail[] = [
                'player' => (string) ($inj['player'] ?? ''),
                'status' => $status,
                'impact' => round($impact, 1),
            ];
        }

        // Plafond pour éviter des écarts absurdes quand toute une équipe est annoncée absente.
        if ($total > self::INJURY_CAP) {
            $total = self::INJURY_CAP;
        }

        return ['impact' => $total, 'players' => $detail];
    }

    /**
     * Estime la probabilité de victoire pour un match donné (appels réseau via StatsManager).
     *
     * @return array<string,mixed> détail complet pour l'affichage et l'explication
     */
    public function estimate(int $homeTeamId, int $awayTeamId): array
    {
        $homeStats = $this->statsManager->teamStats($homeTeamId, 0, '', '', 0, 'N', 'Regular+Season', 'Advanced');
        $awayStats = $this->statsManager->teamStats($awayTeamId, 0, '', '', 0, 'N', 'Regular+Season', 'Advanced');

        $netHome = (float) ($homeStats['NET_RATING'] ?? 0);
        $netAway = (float) ($awayStats['NET_RATING'] ?? 0);
        $paceHome = (float) ($homeStats['PACE'] ?? 0);
        $paceAway = (float) ($awayStats['PACE'] ?? 0);

        $homeInjuries = $this->statsManager->injury($homeTeamId);
        $awayInjuries = $this->statsManager->injury($awayTeamId);
        $homePlayers = $this->statsManager->playersStats($homeTeamId, 0, '', '', 0, 'N', 'Regular+Season');
        $awayPlayers = $this->statsManager->playersStats($awayTeamId, 0, '', '', 0, 'N', 'Regular+Season');

        $homeInj = self::teamInjuryImpact($homeInjuries, $homePlayers);
        $awayInj = self::teamInjuryImpact($awayInjuries, $awayPlayers);

        $poss = self::possessions($paceHome, $paceAway);
        $baseMargin = ($netHome - $netAway) * $poss / 100.0;
        $expected = self::expectedMargin($netHome, $netAway, $poss, $homeInj['impact'], $awayInj['impact']);
        $pHome = self::marginToProbability($expected);
        $pAway = 1.0 - $pHome;

        return [
            'model' => 'net-rating + avantage terrain + blessés',
            'home' => [
                'teamId' => $homeTeamId,
                'name' => (string) ($homeStats['Team'] ?? ''),
                'net' => round($netHome, 1),
                'pace' => round($paceHome, 1),
                'injuries' => $homeInj['players'],
                'injuryImpact' => round($homeInj['impact'], 1),
            ],
            'away' => [
                'teamId' => $awayTeamId,
                'name' => (string) ($awayStats['Team'] ?? ''),
                'net' => round($netAway, 1),
                'pace' => round($paceAway, 1),
                'injuries' => $awayInj['players'],
                'injuryImpact' => round($awayInj['impact'], 1),
            ],
            'params' => [
                'homeAdvantage' => self::HOME_ADVANTAGE,
                'sigma' => self::SIGMA,
                'possessions' => round($poss, 1),
                'damping' => self::INJURY_DAMPING,
            ],
            'baseMargin' => round($baseMargin, 1),
            'expectedMargin' => round($expected, 1),
            'pHome' => round($pHome, 4),
            'pAway' => round($pAway, 4),
            'fairOddsHome' => $pHome > 0 ? round(1.0 / $pHome, 2) : null,
            'fairOddsAway' => $pAway > 0 ? round(1.0 / $pAway, 2) : null,
        ];
    }
}
