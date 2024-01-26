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
    public function getUsersByBalance(): JsonResponse
    {
        $entityManager = $this->getDoctrine()->getManager();
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

        $comment = new Comment();
        $comment->setUsername($data['user']);
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
    public function register(Request $request, EntityManagerInterface $entityManager)
    {
        $data = json_decode($request->getContent(), true);
        $user = new User();
        $user->setName($data['name']);
        $user->setEmail($data['email']);
        $user->setPassword($data['password']);
        $user->setBalance(100);
        $userRepository = $entityManager->getRepository(User::class);
        $userName = $userRepository->findBy(['name' => $data['name']]);
        $userMail = $userRepository->findBy(['email' => $data['email']]);
        if (isset($userName[0])) {
            return new JsonResponse(['message' => 'Ce nom d\'utilisateur est déja pris'], 200);
        }
        if (isset($userMail[0])) {
            if ($userMail[0]->getPassword() === $data['password']) {
                return new JsonResponse(['message' => 'Registration successful'], 200);
            } else {
                return new JsonResponse(['message' => 'Mot de passe incorect '], 200);
            }
        }
        // Persist and flush the user to the database

        $entityManager->persist($user);
        $entityManager->flush();



        return new JsonResponse(['message' => 'Registration successful'], 200);
    }


    /**
     * @Route("/signin", name="signin", methods={"POST"})
     */
    public function signIn(Request $request, EntityManagerInterface $entityManager)
    {
        $data = json_decode($request->getContent(), true);
        $userRepository = $entityManager->getRepository(User::class);
        $userName = $userRepository->findBy(['name' => $data['name']]);
        $userMail = $userRepository->findBy(['email' => $data['email']]);
        $isName = isset($userName[0]);
        $isMail = isset($userMail[0]);
        if ($isName) {
            if ($userName[0]->getPassword() === $data['password']) {
                return new JsonResponse(['message' => 'Registration successful'], 200);
            } else {
                return new JsonResponse(['message' => 'Mot de passe incorect '], 200);
            }
        } elseif ($isMail) {
            if ($userMail[0]->getPassword() === $data['password']) {
                return new JsonResponse(['message' => 'Registration successful'], 200);
            } else {
                return new JsonResponse(['message' => 'Mot de passe incorect '], 200);
            }
        } else {
            return new JsonResponse(['message' => 'Ce nom d\'utilisateur / adresse email n\'est pas reconnu'], 200);
        }
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

        $data = [];
        $aLogo =null;
        $hLogo=null;
        foreach ($bets as $bet) {
            for ($i = 0; $i < count($matchsDeLaNuit); $i++) {
                if ($matchsDeLaNuit[$i]['GameId'] == $bet->getGameId()) {
                    $hLogo = $matchsDeLaNuit[$i]['HomeLogoUrl'];
                    $aLogo = $matchsDeLaNuit[$i]['AwayLogoUrl'];
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
                'aLogo' => $aLogo
                // Add other properties as needed
            ];
        }

        // Create a JSON response with the data
        $response = new JsonResponse($data);
        return $response;
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


                $entityManager = $this->getDoctrine()->getManager();
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
    public function fetchBets(string $gameId, MatchsDeLaNuit $MatchsDeLaNuit): JsonResponse
    {
        $entityManager = $this->getDoctrine()->getManager();
        $betRepository = $entityManager->getRepository(Bet::class);
        $matchsDeLaNuit = $MatchsDeLaNuit->MatchsDeLanuit();

        $bets = $betRepository->findby(
            [
                'gameId' => $gameId,
                'status' => 'pending'
            ]
        );


        // Convert the results to an array or customize the data you want to include in the JSON response
        $data = [];
        foreach ($bets as $bet) {
            for ($i = 0; $i < count($matchsDeLaNuit); $i++) {
                if ($matchsDeLaNuit[$i]['GameId'] == $bet->getGameId()) {
                    $hLogo = $matchsDeLaNuit[$i]['HomeLogoUrl'];
                    $aLogo = $matchsDeLaNuit[$i]['AwayLogoUrl'];
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
                'aLogo' => $aLogo
                // Add other properties as needed
            ];
        }


        // Create a JSON response with the data
        $response = new JsonResponse($data);
        return $response;
    }

    /**
     * @Route("/balance/{user}", name="balance")
     */
    public function balance(string $user): JsonResponse
    {
        $entityManager = $this->getDoctrine()->getManager();
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
    public function bets(string $user, StatsManager $statsManager): JsonResponse
    {
        if (isset($user) && $user != '') {
            $entityManager = $this->getDoctrine()->getManager();
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
        $user = $userRepository->findBy(
            ['name' => $data['user']]
        );
        $balance = $user[0]->getBalance();

        // Persist and flush the user to the database
        $user[0]->setBalance($balance - $data['betAmount']);
        $entityManager->persist($bet);
        $entityManager->persist($user[0]);
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
     * @Route("/check", name="check")
     */
    public function check(BetManager $betManager)
    {
        $entityManager = $this->getDoctrine()->getManager();
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
