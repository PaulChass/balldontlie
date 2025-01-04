<?php

namespace App\Tests\Controller;


use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;


class MainControllerTest extends WebTestCase
{
    public function testIndex()
    {
        $client = static::createClient();
        $client->request('GET', '/');

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertSelectorTextContains('h1', 'Home');
    }

    public function testGetUsersByBalance()
    {
        $client = static::createClient();
        $client->request('GET', '/users/by-balance');

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJson($client->getResponse()->getContent());
    }

    public function testComment()
    {
        $client = static::createClient();
        $client->request('POST', '/comment', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'user' => 'testuser',
            'gameId' => 1,
            'message' => 'This is a test comment',
            'randomId' => 123
        ]));

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJsonStringEqualsJsonString(
            json_encode(['message' => 'Comment successfully added']),
            $client->getResponse()->getContent()
        );
    }

    public function testGetCommentsByGameId()
    {
        $client = static::createClient();
        $client->request('GET', '/comments/1');

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJson($client->getResponse()->getContent());
    }

    public function testRegister()
    {
        $client = static::createClient();
        $client->request('POST', '/register', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'name' => 'testuser',
            'email' => 'testuser@example.com',
            'password' => 'password'
        ]));

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJsonStringEqualsJsonString(
            json_encode(['message' => 'Registration successful']),
            $client->getResponse()->getContent()
        );
    }

    public function testSignIn()
    {
        $client = static::createClient();
        $client->request('POST', '/signin', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'name' => 'testuser',
            'email' => 'testuser@example.com',
            'password' => 'password'
        ]));

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJson($client->getResponse()->getContent());
    }

    public function testAvailableBets()
    {
        $client = static::createClient();
        $client->request('GET', '/availableBets');

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJson($client->getResponse()->getContent());
    }

    public function testAcceptBet()
    {
        $client = static::createClient();
        $client->request('POST', '/acceptBet', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'id' => 1,
            'user' => 'testuser',
            'startTime' => '12:00',
            'startDate' => '2023-01-01',
            'type' => 'type',
            'typeValue' => 'value'
        ]));

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJson($client->getResponse()->getContent());
    }

    public function testFetchBets()
    {
        $client = static::createClient();
        $client->request('GET', '/fetch-bets/1');

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJson($client->getResponse()->getContent());
    }

    public function testBalance()
    {
        $client = static::createClient();
        $client->request('GET', '/balance/testuser');

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJson($client->getResponse()->getContent());
    }

    public function testBets()
    {
        $client = static::createClient();
        $client->request('GET', '/bets/testuser');

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJson($client->getResponse()->getContent());
    }

    public function testBet()
    {
        $client = static::createClient();
        $client->request('POST', '/bet', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'user' => 'testuser',
            'odd' => 1.5,
            'team' => 1,
            'game' => 'game',
            'gameId' => 1,
            'betAmount' => 100,
            'startTime' => '12:00',
            'startDate' => '2023-01-01'
        ]));

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJson($client->getResponse()->getContent());
    }

    public function testStats()
    {
        $client = static::createClient();
        $client->request('GET', '/stats/1/10/all/all/0/false/regular/advanced');

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJson($client->getResponse()->getContent());
    }

    public function testLastNightGames()
    {
        $client = static::createClient();
        $client->request('GET', '/lastnightgames');

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJson($client->getResponse()->getContent());
    }

    public function testCheck()
    {
        $client = static::createClient();
        $client->request('GET', '/check');

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJson($client->getResponse()->getContent());
    }

    public function testPlayersStats()
    {
        $client = static::createClient();
        $client->request('GET', '/playersStats/1/10/all/all/0/false/regular');

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJson($client->getResponse()->getContent());
    }

    public function testGraph()
    {
        $client = static::createClient();
        $client->request('GET', '/graph/stat/1');

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJson($client->getResponse()->getContent());
    }

    public function testInjuries()
    {
        $client = static::createClient();
        $client->request('GET', '/injuries/1');

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJson($client->getResponse()->getContent());
    }

    public function testSimulation()
    {
        $client = static::createClient();
        $client->request('GET', '/simulation/team1/team2');

        $this->assertEquals(Response::HTTP_OK, $client->getResponse()->getStatusCode());
        $this->assertJson($client->getResponse()->getContent());
    }
}