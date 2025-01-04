<?php

namespace App\Tests;

use PHPUnit\Framework\TestCase;
use App\Services\MatchsDeLaNuit;
use ReflectionClass;

class MatchsDeLaNuitTest extends TestCase
{
    public function testScheduleReturnsObject(): void
    {
        // Create an instance of the MatchsDeLaNuit class
        $service = new MatchsDeLaNuit();

        // Use reflection to access the protected method
        $reflection = new ReflectionClass($service);
        $method = $reflection->getMethod('schedule');
        $method->setAccessible(true);

        // Call the schedule method
        $result = $method->invoke($service);

        // Assert that the result is an object
        $this->assertIsObject($result);
    }

    public function testIsSameDateReturnsFalse(): void
    {
        // Create an instance of the MatchsDeLaNuit class
        $service = new MatchsDeLaNuit();

        // Use reflection to access the protected method
        $reflection = new ReflectionClass($service);
        $method = $reflection->getMethod('isSameDate');
        $method->setAccessible(true);

        // Call the isSameDate method
        $result = $method->invoke($service, '2021-10-15T00:00:00', '10/19/2021');
        // Assert that the result is false
        $this->assertFalse($result);
    }

    public function testProcessGameReturnsArray(): void
    {
        // Create an instance of the MatchsDeLaNuit class
        $service = new MatchsDeLaNuit();

        // Use reflection to access the protected method
        $reflection = new ReflectionClass($service);
        $method = $reflection->getMethod('processGame');
        $method->setAccessible(true);

        // Create a mock game object
        $game = (object) [
            'gameId' => 123,
            'gameDuration' => '2:00',
            'gameTime' => '8:00 PM',
            'arena' => 'Staples Center',
            'homeTeam' => (object) [
                'teamId' => '456',
                'teamName' => 'Los Angeles Lakers'
            ],
            'visitorTeam' => (object) [
                'teamId' => '789',
                'teamName' => 'Golden State Warriors'
            ]
        ];

        // Call the processGame method
        $result = $method->invoke($service, $game);

        // Assert that the result is an array
        $this->assertIsArray($result);
    }
}