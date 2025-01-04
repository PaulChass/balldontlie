<?php

namespace App\Tests\Repository;

use App\Entity\Bet;
use App\Repository\BetRepository;
use Doctrine\ORM\EntityManager;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

class BetRepositoryTest extends KernelTestCase
{
    private $entityManager;
    private $betRepository;

    protected function setUp(): void
    {
        $kernel = self::bootKernel();
        $this->entityManager = $kernel->getContainer()->get('doctrine')->getManager();
        $this->betRepository = $this->entityManager->getRepository(Bet::class);
    }

    public function testFindAll()
    {
        $bets = $this->betRepository->findAll();
        $this->assertIsArray($bets);
        $this->assertInstanceOf(Bet::class, $bets[0]);
    }

    public function testFindById()
    {
        $bet = new Bet();
        $this->entityManager->persist($bet);
        $this->entityManager->flush();

        $foundBet = $this->betRepository->find($bet->getId());
        $this->assertInstanceOf(Bet::class, $foundBet);
        $this->assertEquals($bet->getId(), $foundBet->getId());
    }

    public function testFindOneBy()
    {
        $bet = new Bet();
        $this->entityManager->persist($bet);
        $this->entityManager->flush();

        $foundBet = $this->betRepository->findOneBy(['id' => $bet->getId()]);
        $this->assertInstanceOf(Bet::class, $foundBet);
        $this->assertEquals($bet->getId(), $foundBet->getId());
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        $this->entityManager->close();
        $this->entityManager = null;
    }
}