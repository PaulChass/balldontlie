<?php

namespace App\Controller;


use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Goutte\Client;
use Symfony\Component\HttpFoundation\JsonResponse;
use Doctrine\ORM\EntityManagerInterface;

use App\Services\MatchsDeLaNuit;
use App\Services\StatsManager;
use App\Services\WinProbability;
use App\Entity\User;
use App\Entity\Comment;
use App\Security\LegacyPasswordHasher;
use App\Security\SessionAuth;


class MainController extends AbstractController
{
    /**
     * @Route("/", name="home")
     */
    public function index(MatchsDeLaNuit $MatchsDeLaNuit): Response
    {
        $matchsDeLaNuit = $MatchsDeLaNuit->MatchsDeLanuit();
        $matchsDeDemain = $MatchsDeLaNuit->MatchsDeLanuit(1);
        return $this->render('home.html.twig', [
            'matchs' => $matchsDeLaNuit,
            'tomorrow_matchs' => $matchsDeDemain,
            'teamsId' => $MatchsDeLaNuit->TeamsId(intval($matchsDeLaNuit[0]['GameId']))
        ]);
    }



    /**
     * @Route("/comment", name="comment", methods={"POST"})
     */
    public function comment(Request $request, EntityManagerInterface $entityManager, SessionAuth $sessionAuth)
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data) || !isset($data['gameId']) || empty($data['message'])) {
            return new JsonResponse(['message' => 'Commentaire invalide'], 400);
        }

        $comment = new Comment();
        $currentUser = $sessionAuth->getUserName();
        if ($currentUser !== null) {
            // Connecté : on force le vrai pseudo, impossible de commenter au nom d'un autre.
            $comment->setUsername($currentUser);
        } elseif (($data['user'] ?? '') == '') {
            $comment->setUsername('anon' . ($data['randomId'] ?? ''));
        } else {
            $comment->setUsername($data['user']);
        }
        $comment->setGameId($data['gameId']);
        $comment->setMessage($data['message']);
        
        $entityManager->persist($comment);
        $entityManager->flush();

        return new JsonResponse(['message' => 'Comment successfully added'], 200);
    }

    /**
     * @Route("/comments/{gameId}", name="comments_by_game", methods={"GET"})
     */
    public function getCommentsByGameId($gameId, EntityManagerInterface $entityManager)
    {
        // Assuming you have a CommentRepository
        $commentRepository = $entityManager->getRepository(Comment::class);

        // Retrieve all comments for the given gameId
        $comments = $commentRepository->findBy(['gameId' => $gameId]);

        // Transform comments into a format suitable for JSON response
        $formattedComments = [];
        foreach ($comments as $comment) {
            $formattedComments[] = [
                'id' => $comment->getId(),
                'user' => $comment->getUsername(),
                'game' => $comment->getGameId(),
                'content' => $comment->getMessage(),
                // Add any other fields you need
            ];
        }

        return new JsonResponse($formattedComments, 200);
    }
    /**
     * @Route("/register", name="registration", methods={"POST"})
     */
    public function register(Request $request, EntityManagerInterface $entityManager, LegacyPasswordHasher $passwordHasher, SessionAuth $sessionAuth)
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data) || empty($data['name']) || empty($data['email']) || empty($data['password'])) {
            return new JsonResponse(['message' => 'Données d\'inscription incomplètes'], 200);
        }

        $userRepository = $entityManager->getRepository(User::class);

        if ($userRepository->findOneBy(['name' => $data['name']]) !== null) {
            return new JsonResponse(['message' => 'Ce nom d\'utilisateur est déja pris'], 200);
        }

        $existingByMail = $userRepository->findOneBy(['email' => $data['email']]);
        if ($existingByMail !== null) {
            if ($passwordHasher->verify($existingByMail, $data['password'])) {
                $entityManager->flush(); // persiste une éventuelle migration du hash hérité
                $sessionAuth->login($existingByMail); // ouvre la session (ce compte existe déjà)
                return new JsonResponse(['message' => 'Registration successful'], 200);
            }
            return new JsonResponse(['message' => 'Mot de passe incorect '], 200);
        }

        $user = new User();
        $user->setName($data['name']);
        $user->setEmail($data['email']);
        $user->setPassword($passwordHasher->hash($data['password']));
        $user->setBalance(100);

        $entityManager->persist($user);
        $entityManager->flush();

        $sessionAuth->login($user);

        return new JsonResponse(['message' => 'Registration successful'], 200);
    }


    /**
     * @Route("/signin", name="signin", methods={"POST"})
     */
    public function signIn(Request $request, EntityManagerInterface $entityManager, LegacyPasswordHasher $passwordHasher, SessionAuth $sessionAuth)
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data) || empty($data['password']) || (empty($data['name']) && empty($data['email']))) {
            return new JsonResponse(['message' => 'Identifiants incomplets'], 200);
        }

        $userRepository = $entityManager->getRepository(User::class);

        $user = null;
        if (!empty($data['name'])) {
            $user = $userRepository->findOneBy(['name' => $data['name']]);
        }
        if ($user === null && !empty($data['email'])) {
            $user = $userRepository->findOneBy(['email' => $data['email']]);
        }

        if ($user === null) {
            return new JsonResponse(['message' => 'Ce nom d\'utilisateur / adresse email n\'est pas reconnu'], 200);
        }

        if ($passwordHasher->verify($user, $data['password'])) {
            $entityManager->flush(); // persiste une éventuelle migration du hash hérité
            $sessionAuth->login($user);
            return new JsonResponse(['message' => 'Registration successful'], 200);
        }

        return new JsonResponse(['message' => 'Mot de passe incorect '], 200);
    }

    /**
     * Utilisateur actuellement connecté (permet au front de restaurer la session au chargement).
     *
     * @Route("/me", name="me", methods={"GET"})
     */
    public function me(SessionAuth $sessionAuth): JsonResponse
    {
        $user = $sessionAuth->getUser();
        if ($user === null) {
            return new JsonResponse(['authenticated' => false], 200);
        }

        return new JsonResponse([
            'authenticated' => true,
            'name' => $user->getName(),
        ], 200);
    }

    /**
     * @Route("/logout", name="logout", methods={"POST"})
     */
    public function logout(SessionAuth $sessionAuth): JsonResponse
    {
        $sessionAuth->logout();

        return new JsonResponse(['message' => 'logged out'], 200);
    }

    /**
     * @Route("/stats/{teamId}/{lastNgames}/{homeOrAway}/{winLose}/{vsMatchup}/{paceAdjust}/{seasonType}/{measureType}", name="stats")
     */
    public function stats(StatsManager $StatsManager, int $teamId, int $lastNgames, string $homeOrAway, string $winLose, int $vsMatchup, string $paceAdjust, string $seasonType, string $measureType)
    {
        if ($homeOrAway == 'all') {
            $homeOrAway = '';
        }
        if ($winLose == 'all') {
            $winLose = '';
        }
        $stats = $StatsManager->teamStats($teamId, $lastNgames, $homeOrAway, $winLose, $vsMatchup, $paceAdjust, $seasonType, $measureType);
        $response = new JsonResponse(['data' => $stats]);
        $response->headers->set('Access-Control-Allow-Origin', '*');
        return $response;
    }


    /**
     * @Route("/lastnightgames", name="lastnightgames")
     */
    public function lastNightGames(StatsManager $StatsManager )
    {
        $games = $StatsManager->lastNightResults();
        $response = new JsonResponse(['data' => $games]);
        $response->headers->set('Access-Control-Allow-Origin', '*');
        return $response;
    }


    /**
     * @Route("/playersStats/{teamId}/{lastNgames}/{homeOrAway}/{winLose}/{vsMatchup}/{paceAdjust}/{seasonType}", name="playersStats")
     */
    public function playersStats(StatsManager $StatsManager, int $teamId, int $lastNgames, string $homeOrAway, string $winLose, int $vsMatchup, string $paceAdjust, string $seasonType)
    {
        if ($homeOrAway == 'all') {
            $homeOrAway = '';
        }
        if ($winLose == 'all') {
            $winLose = '';
        }
        $stats = $StatsManager->playersStats($teamId, $lastNgames, $homeOrAway, $winLose, $vsMatchup, $paceAdjust, $seasonType);
        $response = new JsonResponse(['data' => $stats]);
        $response->headers->set('Access-Control-Allow-Origin', '*');
        return $response;
    }

    /**
     * @Route("/graph/{stat}/{playerId}", name="graph")
     */
    public function graph(StatsManager $StatsManager, string $stat, int $playerId)
    {
        $graph = $StatsManager->getGraphStats($stat, $playerId);
        $response = new JsonResponse(['data' => $graph]);
        $response->headers->set('Access-Control-Allow-Origin', '*');
        return $response;
    }
    /**
     * @Route("/injuries/{teamId}", name="injuries")
     */
    public function injuries(StatsManager $StatsManager, int $teamId)
    {
        $injuries = $StatsManager->injury($teamId);
        $response = new JsonResponse(['data' => $injuries]);
        $response->headers->set('Access-Control-Allow-Origin', '*');
        return $response;
    }

    /**
     * @Route("/simulation/{hTeam}/{aTeam}", name="simulation")
     */
    public function simulation(string $hTeam, string $aTeam)
    {

        $client = new Client();
        $url = 'https://www.enligne.parionssport.fdj.fr/paris-basketball/usa/nba';
        $crawler = $client->request('GET', $url);
        // Load the HTML document
        $link = $crawler->filter('.psel-event__link');
        $i = 0;
        foreach ($link as $node) {
            // Access the node's value or text content
            $href = $node->getAttribute('href');
            if (str_contains($href, strtolower($hTeam)) && str_contains($href, strtolower($aTeam))) {
                $url = $href;
            }
            $i++;
        }

        $crawler = $client->request('GET', $url);
        $link = $crawler->filter('.psel-outcome__data');
        $j = 0;
        $odds = [];
        foreach ($link as $node) {
            // Access the node's value or text content
            $nodeValue = $node->nodeValue;
            // Do something with the node value
            if ($j < 2) {
                array_push($odds, $nodeValue);
            }
            $j++;
        }
        // Cotes brutes telles qu'affichées par Parions Sport.
        $hoddRaw = isset($odds[0]) ? floatval(str_replace(',', '.', $odds[0])) : 0.0;
        $aoddRaw = isset($odds[1]) ? floatval(str_replace(',', '.', $odds[1])) : 0.0;

        $data['count'] = 1000;
        if ($hoddRaw > 0 && $aoddRaw > 0) {
            // Version « ajustée » (marge du bookmaker retirée), conservée pour compat.
            $oddMultiplier = (1 / $hoddRaw) + (1 / $aoddRaw);
            $hodd = $hoddRaw * $oddMultiplier;
            $aodd = $aoddRaw * $oddMultiplier;
            $data['hWins'] = 1000 / $hodd;
            $data['aWins'] = 1000 / $aodd;
            $data['hOdds'] = $hodd;
            $data['aOdds'] = $aodd;
        } else {
            // Scraping en échec : on ne fabrique pas de cote.
            $data['hWins'] = null;
            $data['aWins'] = null;
            $data['hOdds'] = null;
            $data['aOdds'] = null;
        }
        // Cotes brutes (non ajustées) pour l'affichage.
        $data['hOddsRaw'] = $hoddRaw > 0 ? $hoddRaw : null;
        $data['aOddsRaw'] = $aoddRaw > 0 ? $aoddRaw : null;
        $response = new JsonResponse(['data' => $data]);
        $response->headers->set('Access-Control-Allow-Origin', '*');
        return $response;
    }

    /**
     * Probabilité de victoire estimée par notre modèle (net rating + avantage
     * terrain + blessés), distincte de la cote du bookmaker scrapée par /simulation.
     *
     * @Route("/win-probability/{hTeamId}/{aTeamId}", name="win_probability", requirements={"hTeamId"="\d+","aTeamId"="\d+"})
     */
    public function winProbability(WinProbability $winProbability, int $hTeamId, int $aTeamId): JsonResponse
    {
        $data = $winProbability->estimate($hTeamId, $aTeamId);
        $response = new JsonResponse(['data' => $data]);
        $response->headers->set('Access-Control-Allow-Origin', '*');
        return $response;
    }

}
