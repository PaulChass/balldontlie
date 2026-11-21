<?php

namespace App\Tests\Unit\Security;

use App\Entity\User;
use App\Security\SessionAuth;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Exception\SessionNotFoundException;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Session\SessionInterface;

class SessionAuthTest extends TestCase
{
    private function makeUser(?int $id, string $name): User
    {
        $user = new User();
        $user->setName($name);
        if ($id !== null) {
            $ref = new \ReflectionProperty(User::class, 'id');
            $ref->setAccessible(true);
            $ref->setValue($user, $id);
        }

        return $user;
    }

    public function testLoginStoresUserIdInSession(): void
    {
        $user = $this->makeUser(7, 'alice');

        $session = $this->createMock(SessionInterface::class);
        $session->expects($this->once())
            ->method('set')
            ->with('auth_user_id', 7);

        $requestStack = $this->createMock(RequestStack::class);
        $requestStack->method('getSession')->willReturn($session);

        $em = $this->createMock(EntityManagerInterface::class);

        (new SessionAuth($requestStack, $em))->login($user);
    }

    public function testGetUserReturnsNullWhenNoSessionId(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('get')->with('auth_user_id')->willReturn(null);

        $requestStack = $this->createMock(RequestStack::class);
        $requestStack->method('getSession')->willReturn($session);

        $em = $this->createMock(EntityManagerInterface::class);
        // Le repository ne doit jamais être sollicité si la session est vide.
        $em->expects($this->never())->method('getRepository');

        $this->assertNull((new SessionAuth($requestStack, $em))->getUser());
    }

    public function testGetUserReturnsNullWhenSessionMissing(): void
    {
        $requestStack = $this->createMock(RequestStack::class);
        $requestStack->method('getSession')
            ->willThrowException(new SessionNotFoundException());

        $em = $this->createMock(EntityManagerInterface::class);

        $this->assertNull((new SessionAuth($requestStack, $em))->getUser());
    }

    public function testGetUserLoadsUserFromRepository(): void
    {
        $user = $this->makeUser(42, 'bob');

        $session = $this->createMock(SessionInterface::class);
        $session->method('get')->with('auth_user_id')->willReturn(42);

        $requestStack = $this->createMock(RequestStack::class);
        $requestStack->method('getSession')->willReturn($session);

        $repository = $this->createMock(EntityRepository::class);
        $repository->method('find')
            ->with(42)
            ->willReturn($user);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('getRepository')->with(User::class)->willReturn($repository);

        $auth = new SessionAuth($requestStack, $em);
        $this->assertSame($user, $auth->getUser());
        $this->assertSame('bob', $auth->getUserName());
    }

    public function testLogoutRemovesIdentityAndInvalidates(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->expects($this->once())->method('remove')->with('auth_user_id');
        $session->expects($this->once())->method('invalidate');

        $requestStack = $this->createMock(RequestStack::class);
        $requestStack->method('getSession')->willReturn($session);

        $em = $this->createMock(EntityManagerInterface::class);

        (new SessionAuth($requestStack, $em))->logout();
    }

    public function testLogoutIsSafeWhenSessionMissing(): void
    {
        $requestStack = $this->createMock(RequestStack::class);
        $requestStack->method('getSession')
            ->willThrowException(new SessionNotFoundException());

        $em = $this->createMock(EntityManagerInterface::class);

        // Ne doit pas lever d'exception même sans session active.
        (new SessionAuth($requestStack, $em))->logout();
        $this->addToAssertionCount(1);
    }
}
