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

    /** Préférence « Qualité IA » : privilégier la qualité des réponses de l'assistant
     *  au coût. Stockée en session (pas de migration en prod), par utilisateur connecté. */
    private const AI_QUALITY_KEY = 'ai_prefer_quality';

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

    /**
     * L'utilisateur privilégie-t-il la qualité des réponses IA au coût ?
     * false par défaut (mode économique) et si aucune session.
     */
    public function prefersAiQuality(): bool
    {
        try {
            $session = $this->requestStack->getSession();
        } catch (SessionNotFoundException $e) {
            return false;
        }

        return (bool) $session->get(self::AI_QUALITY_KEY, false);
    }

    /**
     * Enregistre la préférence « Qualité IA » pour la session courante.
     */
    public function setAiQualityPreference(bool $prefer): void
    {
        $this->requestStack->getSession()->set(self::AI_QUALITY_KEY, $prefer);
    }
}
