<?php

namespace App\Tests\Entity;

use App\Entity\Bet;
use PHPUnit\Framework\TestCase;


class BetTest extends TestCase
{
    public function testGetSetId()
    {
        $bet = new Bet();
        $this->assertNull($bet->getId());
    }

    public function testGetSetUsername()
    {
        $bet = new Bet();
        $username = 'testuser';
        $bet->setUsername($username);
        $this->assertSame($username, $bet->getUsername());
    }

    public function testGetSetOdd()
    {
        $bet = new Bet();
        $odd = 1.5;
        $bet->setOdd($odd);
        $this->assertSame($odd, $bet->getOdd());
    }

    public function testGetSetHomeOrAway()
    {
        $bet = new Bet();
        $homeOrAway = 1;
        $bet->setHomeOrAway($homeOrAway);
        $this->assertSame($homeOrAway, $bet->getHomeOrAway());
    }

    public function testGetSetGame()
    {
        $bet = new Bet();
        $game = 'Test Game';
        $bet->setGame($game);
        $this->assertSame($game, $bet->getGame());
    }

    public function testGetSetGameId()
    {
        $bet = new Bet();
        $gameId = 123;
        $bet->setGameId($gameId);
        $this->assertSame($gameId, $bet->getGameId());
    }

    public function testGetSetStatus()
    {
        $bet = new Bet();
        $status = 'pending';
        $bet->setStatus($status);
        $this->assertSame($status, $bet->getStatus());
    }

    public function testGetSetAmount()
    {
        $bet = new Bet();
        $amount = '100';
        $bet->setAmount($amount);
        $this->assertSame($amount, $bet->getAmount());
    }

    public function testGetSetStartTime()
    {
        $bet = new Bet();
        $startTime = '12:00';
        $bet->setStartTime($startTime);
        $this->assertSame($startTime, $bet->getStartTime());
    }

    public function testGetSetStartDate()
    {
        $bet = new Bet();
        $startDate = '2023-10-01';
        $bet->setStartDate($startDate);
        $this->assertSame($startDate, $bet->getStartDate());
    }

    public function testGetSetBetType()
    {
        $bet = new Bet();
        $betType = 'type1';
        $bet->setBetType($betType);
        $this->assertSame($betType, $bet->getBetType());
    }

    public function testGetSetBetTypeValue()
    {
        $bet = new Bet();
        $betTypeValue = 2.5;
        $bet->setBetTypeValue($betTypeValue);
        $this->assertSame($betTypeValue, $bet->getBetTypeValue());
    }

    public function testGetSetPlayerId()
    {
        $bet = new Bet();
        $playerId = 456;
        $bet->setPlayerId($playerId);
        $this->assertSame($playerId, $bet->getPlayerId());
    }
}