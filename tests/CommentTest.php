<?php

namespace App\Tests\Entity;


use App\Entity\Comment;
use PHPUnit\Framework\TestCase;

class CommentTest extends TestCase
{
    public function testGetAndSetGameId()
    {
        $comment = new Comment();
        $comment->setGameId(123);
        $this->assertEquals(123, $comment->getGameId());
    }

    public function testGetAndSetUsername()
    {
        $comment = new Comment();
        $comment->setUsername('testuser');
        $this->assertEquals('testuser', $comment->getUsername());
    }

    public function testGetAndSetMessage()
    {
        $comment = new Comment();
        $comment->setMessage('This is a test message.');
        $this->assertEquals('This is a test message.', $comment->getMessage());
    }
}