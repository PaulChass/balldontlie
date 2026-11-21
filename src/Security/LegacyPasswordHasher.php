<?php

namespace App\Security;

use App\Entity\User;

/**
 * Vérifie les mots de passe et migre de façon transparente les anciens mots de
 * passe stockés en clair vers un hash moderne (bcrypt) lors d'une connexion
 * réussie, sans jamais bloquer les comptes existants.
 *
 * NOTE : la mise à niveau modifie l'entité en mémoire ; l'appelant doit appeler
 * EntityManager::flush() après un verify() réussi pour la persister.
 */
class LegacyPasswordHasher
{
    public function hash(string $plainPassword): string
    {
        return password_hash($plainPassword, PASSWORD_DEFAULT);
    }

    public function verify(User $user, string $plainPassword): bool
    {
        $stored = (string) $user->getPassword();

        // Mot de passe déjà hashé : vérification standard.
        if (password_get_info($stored)['algo']) {
            return password_verify($plainPassword, $stored);
        }

        // Ancien mot de passe en clair hérité : on compare, puis on migre vers un hash.
        if ($stored !== '' && hash_equals($stored, $plainPassword)) {
            $user->setPassword($this->hash($plainPassword));

            return true;
        }

        return false;
    }
}
