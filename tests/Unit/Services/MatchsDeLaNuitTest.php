<?php

namespace App\Tests\Unit\Services;

use App\Nba\NbaClient;
use App\Services\MatchsDeLaNuit;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

/**
 * Tests unitaires des méthodes pures (sans réseau) de MatchsDeLaNuit.
 */
class MatchsDeLaNuitTest extends TestCase
{
    private function service(): MatchsDeLaNuit
    {
        return new MatchsDeLaNuit(new NbaClient());
    }

    /**
     * Invoque une méthode privée/protégée via réflexion.
     */
    private function call(string $method, ...$args)
    {
        $m = new ReflectionMethod(MatchsDeLaNuit::class, $method);
        $m->setAccessible(true);

        return $m->invoke($this->service(), ...$args);
    }

    public function testIsSameDateComparesOnlyTheDatePart(): void
    {
        $this->assertTrue($this->call('isSameDate', '10/19/2021 20:00', '10/19/2021'));
        $this->assertFalse($this->call('isSameDate', '10/15/2021', '10/19/2021'));
    }

    public function testConvertTimeShiftsUtcToParis(): void
    {
        // 00:30 UTC -> 01:30 (UTC+1 dans le code)
        $this->assertSame('01:30', $this->call('convertTime', '2024-10-19T00:30:00Z'));
    }

    public function testConvertPmTime(): void
    {
        // "7:30pm" -> [ (7 + 12 + 6) % 24, "30" ] = [1, "30"]
        $this->assertSame([1, '30'], $this->call('convertPmTime', '7:30pm'));
    }

    public function testConvertAmTime(): void
    {
        // "11:00am" -> [ (11 + 6) % 24, "00" ] = [17, "00"]
        $this->assertSame([17, '00'], $this->call('convertAmTime', '11:00am'));
    }

    public function testGetStartTimeIsNullWhenGameNotScheduled(): void
    {
        // Statut != 1 (match non "à venir") => pas d'heure de début.
        $this->assertNull($this->call('getStartTime', 2, 'Final'));
    }

    public function testProcessGameMapsExpectedFields(): void
    {
        $game = (object) [
            'gameId' => '123',
            'gameDateTimeUTC' => '2024-10-19T23:00:00Z',
            'gameDateUTC' => '2024-10-19T00:00:00Z',
            'gameStatus' => 2,
            'gameStatusText' => 'Final',
            'homeTeam' => (object) ['teamId' => 1610612744, 'score' => 110],
            'awayTeam' => (object) ['teamId' => 1610612747, 'score' => 104],
        ];

        $result = $this->call('processGame', $game);

        $this->assertSame('123', $result['GameId']);
        $this->assertSame(1610612744, $result['HomeTeamId']);
        $this->assertSame(1610612747, $result['AwayTeamId']);
        $this->assertSame(110, $result['homeScore']);
        $this->assertSame(104, $result['awayScore']);
        $this->assertStringContainsString('1610612744', $result['HomeLogoUrl']);
    }
}
