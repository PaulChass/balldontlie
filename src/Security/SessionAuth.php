<?php

namespace App\Security;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Exception\SessionNotFoundException;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Source unique de vérité pour l'identité de l'utilisateur connecté.
 *
 * L'identité est stockée côté serveur dans la session (jamais dérivée du corps
 * de la requête), ce qui empêche un client d'agir au nom d'un autre utilisateur.
 * Le cookie de session est configuré en SameSite=Lax (voir framework.yaml), ce
 * qui fournit une protection CSRF de base pour les requêtes mutantes.
 */
class SessionAuth
{
    private const SESSION_KEY = 'auth_user_id';

    public function __construct(
        private readonly RequestStack $requestStack,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * Ouvre la session pour cet utilisateur (appelé après vérification du mot de passe).
     */
    public function login(User $user): void
    {
        $this->requestStack->getSession()->set(self::SESSION_KEY, $user->getId());
    }

    /**
     * Ferme et invalide la session courante.
     */
    public function logout(): void
    {
        try {
            $session = $this->requestStack->getSession();
        } catch (SessionNotFoundException $e) {
            return;
        }
        $session->remove(self::SESSION_KEY);
        $session->invalidate();
    }

    /**
     * Utilisateur actuellement connecté, ou null si la session est absente/expirée.
     */
    public function getUser(): ?User
    {
        try {
            $session = $this->requestStack->getSession();
        } catch (SessionNotFoundException $e) {
            return null;
        }

        $id = $session->get(self::SESSION_KEY);
        if ($id === null) {
            return null;
        }

        return $this->entityManager->getRepository(User::class)->find($id);
    }

    /**
     * Nom de l'utilisateur connecté, ou null.
     */
    public function getUserName(): ?string
    {
        $user = $this->getUser();

        return $user !== null ? $user->getName() : null;
    }
}
