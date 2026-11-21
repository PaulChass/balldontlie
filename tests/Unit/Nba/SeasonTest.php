<?php

namespace App\Tests\Unit\Nba;

use App\Nba\Season;
use PHPUnit\Framework\TestCase;

class SeasonTest extends TestCase
{
    public function testCurrentSeasonUsesNbaFormat(): void
    {
        // Les APIs stats.nba.com attendent le format "AAAA-AA" (ex. "2026-27").
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}$/', Season::CURRENT);
    }
}
