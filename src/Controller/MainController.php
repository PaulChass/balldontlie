<?php

namespace App\Controller;


use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Goutte\Client;
use Symfony\Component\HttpFoundation\JsonResponse;
use Doctrine\ORM\EntityManagerInterface;
use App\Services\BetManager;

use App\Services\MatchsDeLaNuit;
use App\Services\StatsManager;
use App\Entity\User;
use App\Entity\Bet;
use App\Entity\Comment;
use App\Security\LegacyPasswordHasher;


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
     * @Route("/users/by-balance", name="users_by_balance")
     */
    public function getUsersByBalance(EntityManagerInterface $entityManager): JsonResponse
    {
        $userRepository = $entityManager->getRepository(User::class);

        // Utilisation de la méthode findBy pour récupérer la liste de tous les utilisateurs, triée par solde décroissant
        $users = $userRepository->findBy(
            [],
            ['balance' => 'DESC']
        );

        // Création d'un tableau pour stocker les données des utilisateurs
        $userData = [];
        foreach ($users as $user) {
            $userData[] = [
                'id' => $user->getId(),
                'name' => $user->getName(),
                'balance' => $user->getBalance(),
            ];
        }

        // Création d'une réponse JSON avec la liste de tous les utilisateurs triée par solde décroissant
        $response = new JsonResponse($userData);
        return $response;
    }

    /**
     * @Route("/comment", name="comment", methods={"POST"})
     */
    public function comment(Request $request, EntityManagerInterface $entityManager)
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data) || !isset($data['gameId']) || empty($data['message'])) {
            return new JsonResponse(['message' => 'Commentaire invalide'], 400);
        }

        $comment = new Comment();
        if (($data['user'] ?? '') == '') {
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
    public function register(Request $request, EntityManagerInterface $entityManager, LegacyPasswordHasher $passwordHasher)
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

        return new JsonResponse(['message' => 'Registration successful'], 200);
    }


    /**
     * @Route("/signin", name="signin", methods={"POST"})
     */
    public function signIn(Request $request, EntityManagerInterface $entityManager, LegacyPasswordHasher $passwordHasher)
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
            return new JsonResponse(['message' => 'Registration successful'], 200);
        }

        return new JsonResponse(['message' => 'Mot de passe incorect '], 200);
    }
    /**
     * @Route("/availableBets", name="availableBets", methods={"GET"})
     */
    public function availableBets(MatchsDeLaNuit $MatchsDeLaNuit, Request $request, EntityManagerInterface $entityManager)
    {
        $matchsDeLaNuit = $MatchsDeLaNuit->MatchsDeLanuit();

        $betRepository = $entityManager->getRepository(Bet::class);
        $bets = $betRepository->findBy(
            ['status' => 'pending']
        );

        $data = $this->formatBetsWithLogos($bets, $matchsDeLaNuit);

        return new JsonResponse($data);
    }

    /**
     * Formate une liste de paris pour la réponse JSON, en y associant les logos
     * des équipes trouvés dans les matchs de la nuit.
     *
     * @param Bet[]              $bets
     * @param array<int, array>  $matchsDeLaNuit
     * @return array<int, array>
     */
    private function formatBetsWithLogos(array $bets, array $matchsDeLaNuit): array
    {
        $data = [];
        foreach ($bets as $bet) {
            $hLogo = null;
            $aLogo = null;
            foreach ($matchsDeLaNuit as $match) {
                if ($match['GameId'] == $bet->getGameId()) {
                    $hLogo = $match['HomeLogoUrl'];
                    $aLogo = $match['AwayLogoUrl'];
                }
            }
            $data[] = [
                'id' => $bet->getId(),
                'Game' => $bet->getGame(),
                'GameId' => $bet->getGameId(),
                'Odd' => $bet->getOdd(),
                'Amount' => $bet->getAmount(),
                'HomeorAway' => $bet->getHomeOrAway(),
                'Username' => $bet->getUsername(),
                'startTime' => $bet->getStartTime(),
                'startDate' => $bet->getStartDate(),
                'type' => $bet->getBetType(),
                'typeValue' => $bet->getBetTypeValue(),
                'username' => $bet->getUsername(),
                'playerId' => $bet->getPlayerId(),
                'hLogo' => $hLogo,
                'aLogo' => $aLogo,
            ];
        }

        return $data;
    }

    /**
     * @Route("/acceptBet", name="acceptBet", methods={"POST"})
     */
    public function acceptBet(Request $request, EntityManagerInterface $entityManager)
    {

        $data = json_decode($request->getContent(), true);
        $today = getdate();

        $day = $today['mday'];
        if ($today['hours'] < 6) {
            $day = $day - 1;
        }
        $betDateArray = explode('-', $data['startDate']);
        $betTimeArray = explode(':', $data['startTime']);


        if ($betDateArray[0] == $today['year'] && $betDateArray[1] == $today['mon'] && $betDateArray[2] == $day) {
            if ($today['hours'] > 6 || $today['hours'] < $betTimeArray[0] || ($today['hours'] == $betTimeArray[0] && $today['minutes'] < (int) $betTimeArray[1])) {


                $betRepository = $entityManager->getRepository(Bet::class);
                $userRepository = $entityManager->getRepository(User::class);
                $user = $userRepository->findBy(
                    ['name' => $data['user']]
                );
                $balance = $user[0]->getBalance();

                $id = $data['id'];
                $originalBet = $betRepository->find($id);
                $originalBet->setStatus('accepted');
                $bet = new Bet();

                $odd = 1 / (1 - (1 / $originalBet->getOdd()));
                $amount = $originalBet->getAmount() * $originalBet->getOdd() - $originalBet->getAmount();
                $game = $originalBet->getGame();
                if ($originalBet->getHomeOrAway() == 0) {
                    $homeOrAway = 1;
                } else {
                    $homeOrAway = 0;
                }
                $bet->setUsername($data['user']);
                $bet->setOdd($odd);
                $bet->setStartTime($data['startTime']);
                $bet->setStartDate($data['startDate']);
                $bet->setBetType($data['type']);
                $bet->setBetTypeValue($data['typeValue']);
                $bet->setHomeOrAway($homeOrAway);
                $bet->setGame($game);
                $bet->setGameId($originalBet->getGameId());
                $bet->setStatus('accepted');
                $bet->setAmount($amount);
                $user[0]->setBalance($balance - $amount);



                // Persist and flush the user to the database

                $entityManager->persist($bet);
                $entityManager->persist($user[0]);


                $entityManager->persist($originalBet);
                $entityManager->flush();

                return new JsonResponse(['message' => 'Pari enregistré'], 200);
            }
        } else {
            return new JsonResponse(['message' => 'Le pari n\'est plus disponible '], 200);
        }

    }


    /**
     * @Route("/fetch-bets/{gameId}", name="fetch_bets")
     */
    public function fetchBets(string $gameId, MatchsDeLaNuit $MatchsDeLaNuit, EntityManagerInterface $entityManager): JsonResponse
    {
        $betRepository = $entityManager->getRepository(Bet::class);
        $matchsDeLaNuit = $MatchsDeLaNuit->MatchsDeLanuit();

        $bets = $betRepository->findby(
            [
                'gameId' => $gameId,
                'status' => 'pending'
            ]
        );


        $data = $this->formatBetsWithLogos($bets, $matchsDeLaNuit);

        return new JsonResponse($data);
    }

    /**
     * @Route("/balance/{user}", name="balance")
     */
    public function balance(string $user, EntityManagerInterface $entityManager): JsonResponse
    {
        $userRepository = $entityManager->getRepository(User::class);

        $user = $userRepository->findby(
            ['name' => $user]
        );

        $data = $user[0]->getBalance();
        $response = new JsonResponse($data);
        return $response;
    }

    /**
     * @Route("/bets/{user}", name="bets")
     */
    public function bets(string $user, StatsManager $statsManager, EntityManagerInterface $entityManager): JsonResponse
    {
        if (isset($user) && $user != '') {
            $betRepository = $entityManager->getRepository(Bet::class);
            $bets = $betRepository->findby(
                ['username' => $user]
            );
           
            
            $entityManager->flush();

            // Convert the results to an array or customize the data you want to include in the JSON response
            $data = [];
            foreach ($bets as $bet) {
                $data[] = [
                    'id' => $bet->getId(),
                    'Game' => $bet->getGame(),
                    'Odd' => $bet->getOdd(),
                    'Amount' => $bet->getAmount(),
                    'HomeorAway' => $bet->getHomeOrAway(),
                    'Status' => $bet->getStatus(),
                    'type' => $bet->getBetType(),
                    'typeValue' => $bet->getBetTypeValue()
                    // Add other properties as needed
                ];
            }

            // Create a JSON response with the data
            $response = new JsonResponse($data);
            return $response;
        }
        $data = [];
        $response = new JsonResponse($data);
        return $response;
    }


    /**
     * @Route("/bet", name="bet", methods={"POST"})
     */
    public function bet(Request $request, EntityManagerInterface $entityManager)
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data) || empty($data['user']) || !isset($data['betAmount'])) {
            return new JsonResponse(['message' => 'Pari invalide'], 400);
        }

        $bet = new Bet();
        $bet->setUsername($data['user']);
        $bet->setOdd($data['odd']);
        $bet->setHomeOrAway($data['team']);
        $bet->setGame($data['game']);
        $bet->setGameId($data['gameId']);
        $bet->setStatus('accepted');
        $bet->setAmount($data['betAmount']);
        $bet->setStartTime($data['startTime']);
        $bet->setStartDate($data['startDate']);
        if (isset($data['betType'])) {
            $bet->setBetType($data['betType']);
        }
        if (isset($data['betTypeAmount'])) {
            $bet->setBetTypeValue($data['betTypeAmount']);
        }
        if (isset($data['playerId'])) {
            $bet->setPlayerId($data['playerId']);
        }

        $userRepository = $entityManager->getRepository(User::class);
        $user = $userRepository->findOneBy(['name' => $data['user']]);
        if ($user === null) {
            return new JsonResponse(['message' => 'Utilisateur inconnu'], 404);
        }
        $balance = $user->getBalance();

        // Persist and flush the user to the database
        $user->setBalance($balance - $data['betAmount']);
        $entityManager->persist($bet);
        $entityManager->persist($user);
        $entityManager->flush();



        return new JsonResponse(['message' => 'Registration successful'], 200);
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
     * @Route("/check", name="check")
     */
    public function check(BetManager $betManager, EntityManagerInterface $entityManager)
    {
        $betRepository = $entityManager->getRepository(Bet::class);
        $userRepository = $entityManager->getRepository(User::class);
        $betManager->checkGames($betRepository, $userRepository, $entityManager);
        $response = new JsonResponse('done');
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
        $hodd = str_replace(',', '.', $odds[0]);
        $aodd = str_replace(',', '.', $odds[1]);
        $oddMultiplier = (1 / floatval($hodd)) + (1 / floatval($aodd));
        $hodd = floatval($hodd) * $oddMultiplier;
        $aodd = floatval($aodd) * $oddMultiplier;
        $data['count'] = 1000;
        $data['hWins'] = 1000 / $hodd;
        $data['aWins'] = 1000 / $aodd;
        $data['hOdds'] = $hodd;
        $data['aOdds'] = $aodd;
        $response = new JsonResponse(['data' => $data]);
        $response->headers->set('Access-Control-Allow-Origin', '*');
        return $response;
    }

}
