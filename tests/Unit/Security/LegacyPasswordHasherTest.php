<?php

namespace App\Tests\Unit\Security;

use App\Entity\User;
use App\Security\LegacyPasswordHasher;
use PHPUnit\Framework\TestCase;

class LegacyPasswordHasherTest extends TestCase
{
    public function testHashIsNotPlaintextAndIsVerifiable(): void
    {
        $hasher = new LegacyPasswordHasher();
        $hash = $hasher->hash('secret');

        $this->assertNotSame('secret', $hash);
        $this->assertTrue((bool) password_get_info($hash)['algo']);

        $user = (new User())->setPassword($hash);
        $this->assertTrue($hasher->verify($user, 'secret'));
        $this->assertFalse($hasher->verify($user, 'wrong'));
    }

    public function testLegacyPlaintextIsAcceptedThenUpgradedToHash(): void
    {
        $hasher = new LegacyPasswordHasher();
        $user = (new User())->setPassword('plaintextlegacy'); // mot de passe hérité en clair

        $this->assertTrue($hasher->verify($user, 'plaintextlegacy'));

        // Après une vérification réussie, le mot de passe est migré vers un hash...
        $this->assertNotSame('plaintextlegacy', $user->getPassword());
        $this->assertTrue((bool) password_get_info($user->getPassword())['algo']);

        // ...et reste vérifiable.
        $this->assertTrue($hasher->verify($user, 'plaintextlegacy'));
    }

    public function testWrongLegacyPlaintextIsRejectedAndUnchanged(): void
    {
        $hasher = new LegacyPasswordHasher();
        $user = (new User())->setPassword('legacy');

        $this->assertFalse($hasher->verify($user, 'nope'));
        $this->assertSame('legacy', $user->getPassword());
    }
}
