<?php

namespace App\Tests\Repository;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManager;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;


class UserRepositoryTest extends KernelTestCase
{
    private $entityManager;
    private $userRepository;

    protected function setUp(): void
    {
        $kernel = self::bootKernel();
        $this->entityManager = $kernel->getContainer()
            ->get('doctrine')
            ->getManager();
        $this->userRepository = $this->entityManager->getRepository(User::class);
    }

    public function testFind()
    {
        $user = new User();
        $user->setUsername('testuser');
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $foundUser = $this->userRepository->find($user->getId());
        $this->assertSame($user->getUsername(), $foundUser->getUsername());
    }

    public function testFindOneBy()
    {
        $user = new User();
        $user->setUsername('uniqueuser');
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $foundUser = $this->userRepository->findOneBy(['username' => 'uniqueuser']);
        $this->assertSame($user->getUsername(), $foundUser->getUsername());
    }

    public function testFindAll()
    {
        $user1 = new User();
        $user1->setUsername('user1');
        $this->entityManager->persist($user1);

        $user2 = new User();
        $user2->setUsername('user2');
        $this->entityManager->persist($user2);

        $this->entityManager->flush();

        $users = $this->userRepository->findAll();
        $this->assertCount(2, $users);
    }

    public function testFindBy()
    {
        $user = new User();
        $user->setUsername('findbyuser');
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $users = $this->userRepository->findBy(['username' => 'findbyuser']);
        $this->assertCount(1, $users);
        $this->assertSame($user->getUsername(), $users[0]->getUsername());
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        $this->entityManager->close();
        $this->entityManager = null;
    }
}