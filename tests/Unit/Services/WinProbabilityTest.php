<?php

namespace App\Tests\Unit\Services;

use App\Services\WinProbability;
use PHPUnit\Framework\TestCase;

class WinProbabilityTest extends TestCase
{
    public function testNormalCdfKnownValues(): void
    {
        // Φ(0) = 0,5 ; symétrie ; valeur de référence Φ(1) ≈ 0,8413.
        $this->assertEqualsWithDelta(0.5, WinProbability::normalCdf(0.0), 1e-6);
        $this->assertEqualsWithDelta(0.8413, WinProbability::normalCdf(1.0), 1e-3);
        $this->assertEqualsWithDelta(0.1587, WinProbability::normalCdf(-1.0), 1e-3);
    }

    public function testEqualTeamsAtNeutralGiveFiftyFifty(): void
    {
        // Deux équipes identiques, sans avantage terrain ni blessés → 50/50.
        $margin = WinProbability::expectedMargin(0.0, 0.0, 100.0, 0.0, 0.0, 0.0);
        $this->assertSame(0.0, $margin);
        $this->assertEqualsWithDelta(0.5, WinProbability::marginToProbability($margin), 1e-9);
    }

    public function testHomeAdvantageFavorsHome(): void
    {
        $margin = WinProbability::expectedMargin(0.0, 0.0, 100.0, 0.0, 0.0);
        $this->assertSame(WinProbability::HOME_ADVANTAGE, $margin);
        $this->assertGreaterThan(0.5, WinProbability::marginToProbability($margin));
    }

    public function testStrongerNetRatingRaisesProbability(): void
    {
        // +10 de net rating sur 100 possessions = +10 pts, en plus de l'avantage terrain.
        $margin = WinProbability::expectedMargin(5.0, -5.0, 100.0, 0.0, 0.0);
        $this->assertEqualsWithDelta(10.0 + WinProbability::HOME_ADVANTAGE, $margin, 1e-9);
        $this->assertGreaterThan(0.80, WinProbability::marginToProbability($margin));
    }

    public function testPaceScalesTheMargin(): void
    {
        // À net rating égal, un rythme plus élevé amplifie l'écart attendu.
        $slow = WinProbability::expectedMargin(4.0, 0.0, 90.0, 0.0, 0.0, 0.0);
        $fast = WinProbability::expectedMargin(4.0, 0.0, 110.0, 0.0, 0.0, 0.0);
        $this->assertGreaterThan($slow, $fast);
        $this->assertEqualsWithDelta(3.6, $slow, 1e-9);  // 4 * 90/100
        $this->assertEqualsWithDelta(4.4, $fast, 1e-9);  // 4 * 110/100
    }

    public function testHomeInjuriesHurtHomeAwayInjuriesHelpHome(): void
    {
        $base = WinProbability::expectedMargin(0.0, 0.0, 100.0, 0.0, 0.0);
        $homeHurt = WinProbability::expectedMargin(0.0, 0.0, 100.0, 6.0, 0.0);
        $awayHurt = WinProbability::expectedMargin(0.0, 0.0, 100.0, 0.0, 6.0);
        $this->assertSame($base - 6.0, $homeHurt);
        $this->assertSame($base + 6.0, $awayHurt);
    }

    public function testStatusWeightOrdering(): void
    {
        $this->assertSame(1.0, WinProbability::statusWeight('Out'));
        $this->assertSame(0.75, WinProbability::statusWeight('Doubtful'));
        $this->assertSame(0.4, WinProbability::statusWeight('GTD'));
        $this->assertSame(0.15, WinProbability::statusWeight('Probable'));
        $this->assertSame(0.0, WinProbability::statusWeight('Available'));
    }

    public function testPlayerImpactUsesPointsDampingAndStatus(): void
    {
        // 20 pts/match : Out → 20*0,5*1,0 = 10 ; Questionable → 20*0,5*0,4 = 4 ; Probable → 20*0,5*0,15 = 1,5.
        $this->assertEqualsWithDelta(10.0, WinProbability::playerImpact(20.0, 'Out'), 1e-9);
        $this->assertEqualsWithDelta(4.0, WinProbability::playerImpact(20.0, 'Questionable'), 1e-9);
        $this->assertEqualsWithDelta(1.5, WinProbability::playerImpact(20.0, 'Probable'), 1e-9);
    }

    public function testTeamInjuryImpactMatchesByNameAndCaps(): void
    {
        $players = [
            ['name' => 'LeBron James', 'points' => 25.0],
            ['name' => 'Anthony Davis', 'points' => 24.0],
            ['name' => 'Austin Reaves', 'points' => 16.0],
        ];
        $injuries = [
            ['player' => 'LeBron James', 'status' => 'Out'],       // 25*0.5 = 12.5
            ['player' => 'Anthony Davis', 'status' => 'Out'],      // 24*0.5 = 12
            ['player' => 'Someone Unknown', 'status' => 'Probable'], // ignoré
        ];
        $res = WinProbability::teamInjuryImpact($injuries, $players);
        // Total brut 24,5 mais plafonné à INJURY_CAP = 12.
        $this->assertSame(WinProbability::INJURY_CAP, $res['impact']);
        $this->assertCount(2, $res['players']);
    }

    public function testUnmatchedInjuredPlayerUsesFallback(): void
    {
        $res = WinProbability::teamInjuryImpact(
            [['player' => 'Ghost Player', 'status' => 'Out']],
            [['name' => 'Someone Else', 'points' => 10.0]]
        );
        // Forfait : 6 * 0,5 * 1,0 = 3.
        $this->assertEqualsWithDelta(3.0, $res['impact'], 1e-9);
        $this->assertCount(1, $res['players']);
    }

    public function testNormalizeNameIgnoresCaseAccentsPunctuation(): void
    {
        $this->assertSame(
            WinProbability::normalizeName('Nikola Jokić'),
            WinProbability::normalizeName('nikola jokic')
        );
        $this->assertSame(
            WinProbability::normalizeName('Jaren Jackson Jr.'),
            WinProbability::normalizeName('jaren jackson jr')
        );
    }
}
