<?php

namespace App\Tests\Repository;

use App\Entity\Comment;
use App\Repository\CommentRepository;
use Doctrine\ORM\EntityManager;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;


class CommentRepositoryTest extends KernelTestCase
{
    private $entityManager;
    private $commentRepository;

    protected function setUp(): void
    {
        $kernel = self::bootKernel();
        $this->entityManager = $kernel->getContainer()
            ->get('doctrine')
            ->getManager();
        $this->commentRepository = $this->entityManager->getRepository(Comment::class);
    }

    public function testFindAll()
    {
        $comments = $this->commentRepository->findAll();
        $this->assertIsArray($comments);
        $this->assertInstanceOf(Comment::class, $comments[0]);
    }

    public function testFind()
    {
        $comment = $this->commentRepository->find(1);
        $this->assertInstanceOf(Comment::class, $comment);
    }

    public function testFindOneBy()
    {
        $comment = $this->commentRepository->findOneBy(['id' => 1]);
        $this->assertInstanceOf(Comment::class, $comment);
    }

    public function testFindBy()
    {
        $comments = $this->commentRepository->findBy(['id' => 1]);
        $this->assertIsArray($comments);
        $this->assertInstanceOf(Comment::class, $comments[0]);
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        $this->entityManager->close();
        $this->entityManager = null;
    }
}