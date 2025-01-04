<?php

namespace App\Tests\Entity;

use App\Entity\User;
use PHPUnit\Framework\TestCase;


class UserTest extends TestCase
{
    public function testGetId()
    {
        $user = new User();
        $this->assertNull($user->getId());
    }

    public function testGetName()
    {
        $user = new User();
        $user->setName('John Doe');
        $this->assertEquals('John Doe', $user->getName());
    }

    public function testSetName()
    {
        $user = new User();
        $user->setName('John Doe');
        $this->assertEquals('John Doe', $user->getName());
    }

    public function testGetEmail()
    {
        $user = new User();
        $user->setEmail('john.doe@example.com');
        $this->assertEquals('john.doe@example.com', $user->getEmail());
    }

    public function testSetEmail()
    {
        $user = new User();
        $user->setEmail('john.doe@example.com');
        $this->assertEquals('john.doe@example.com', $user->getEmail());
    }

    public function testGetPassword()
    {
        $user = new User();
        $user->setPassword('password123');
        $this->assertEquals('password123', $user->getPassword());
    }

    public function testSetPassword()
    {
        $user = new User();
        $user->setPassword('password123');
        $this->assertEquals('password123', $user->getPassword());
    }

    public function testGetBalance()
    {
        $user = new User();
        $user->setBalance(100.50);
        $this->assertEquals(100.50, $user->getBalance());
    }

    public function testSetBalance()
    {
        $user = new User();
        $user->setBalance(100.50);
        $this->assertEquals(100.50, $user->getBalance());
    }
}