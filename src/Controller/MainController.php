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
use App\Entity\User;
use App\Entity\Bet;

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
            'teamsId'=> $MatchsDeLaNuit->TeamsId(intval($matchsDeLaNuit[0]['GameId']))
        ]);
    }

    /**
     * @Route("/register", name="registration", methods={"POST"})
     */
    public function register(Request $request,EntityManagerInterface $entityManager)
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
        if(isset($userName[0])){
            return new JsonResponse(['message' => 'Ce nom d\'utilisateur est déja pris'], 200);}
        if(isset($userMail[0])){
            if($userMail[0]->getPassword()===$data['password']){
                return new JsonResponse(['message' => 'Registration successful'], 200);
            }
            else{                
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
    public function signIn(Request $request,EntityManagerInterface $entityManager)
    {
        $data = json_decode($request->getContent(), true);
        $userRepository = $entityManager->getRepository(User::class);
        $userName = $userRepository->findBy(['name' => $data['name']]);
        $userMail = $userRepository->findBy(['email' => $data['email']]);
        $isName = isset($userName[0]);
        $isMail = isset($userMail[0]);
            if($isName){
                if($userName[0]->getPassword()===$data['password']){ 
                    return new JsonResponse(['message' => 'Registration successful'], 200);
                } else {
                    return new JsonResponse(['message' => 'Mot de passe incorect '], 200);}
            } elseif($isMail){
                if($userMail[0]->getPassword()===$data['password']){
                    return new JsonResponse(['message' => 'Registration successful'], 200);
                } else {
                    return new JsonResponse(['message' => 'Mot de passe incorect '], 200);}
            } else {return new JsonResponse(['message' => 'Ce nom d\'utilisateur / adresse email n\'est pas reconnu'], 200);}
        

           
    }
    /**
     * @Route("/acceptBet", name="acceptBet", methods={"POST"})
     */
    public function acceptBet(Request $request,EntityManagerInterface $entityManager)
    {
        $data = json_decode($request->getContent(), true);

        $entityManager = $this->getDoctrine()->getManager();
        $betRepository = $entityManager->getRepository(Bet::class);
        $userRepository = $entityManager->getRepository(User::class);
        $user = $userRepository->findBy(
            ['name' => $data['user']]);
            $balance = $user[0]->getBalance();
    
        $id = $data['id'];
        $originalBet = $betRepository->find($id);
        $originalBet->setStatus('accepted');
        $bet = new Bet();
       
        $odd = 1/(1-(1/$originalBet->getOdd()));
        $amount = $originalBet->getAmount()*$originalBet->getOdd()-$originalBet->getAmount();
        $game = $originalBet->getGame();
        if($originalBet->getHomeOrAway()==0){$homeOrAway=1;}else{$homeOrAway=0;}
        $bet->setUsername($data['user']);
        $bet->setOdd($odd);
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
        
        return new JsonResponse(['message' => 'Registration successful'], 200);
    }
    
    
   /**
     * @Route("/fetch-bets/{gameName}", name="fetch_bets")
     */
    public function fetchBets(string $gameName): JsonResponse
    {
        $entityManager = $this->getDoctrine()->getManager();
        $betRepository = $entityManager->getRepository(Bet::class);

        $bets = $betRepository->findby(
            ['game' => $gameName,
            'status' => 'pending'    
        ]);
        

        // Convert the results to an array or customize the data you want to include in the JSON response
        $data = [];
        foreach ($bets as $bet) {
            $data[] = [
                'id' => $bet->getId(),
                'Game' => $bet->getGame(),
                'Odd' => $bet->getOdd(),
                'Amount' => $bet->getAmount(),
                'HomeorAway' => $bet->getHomeOrAway()
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
            ['name' => $user]);

        $data = $user[0]->getBalance();
        $response = new JsonResponse($data);
            return $response;
    }

     /**
     * @Route("/bets/{user}", name="bets")
     */
    public function bets(string $user): JsonResponse
    {
        $entityManager = $this->getDoctrine()->getManager();
        $betRepository = $entityManager->getRepository(Bet::class);

        $bets = $betRepository->findby(
            ['username' => $user]);
        // Convert the results to an array or customize the data you want to include in the JSON response
        $data = [];
        foreach ($bets as $bet) {
            $data[] = [
                'id' => $bet->getId(),
                'Game' => $bet->getGame(),
                'Odd' => $bet->getOdd(),
                'Amount' => $bet->getAmount(),
                'HomeorAway' => $bet->getHomeOrAway(),
                'Status'=>$bet->getStatus()
                // Add other properties as needed
            ];
        }

        // Create a JSON response with the data
        $response = new JsonResponse($data);
        return $response;
    }


      /**
     * @Route("/bet", name="bet", methods={"POST"})
     */
    public function bet(Request $request,EntityManagerInterface $entityManager)
    {
        $data = json_decode($request->getContent(), true);
        
        $bet = new Bet();
        $bet->setUsername($data['user']);
        $bet->setOdd($data['odd']);
        $bet->setHomeOrAway($data['team']);
        $bet->setGame($data['game']);
        $bet->setGameId($data['gameId']);
        $bet->setStatus('pending');
        $bet->setAmount($data['betAmount']);

        $userRepository = $entityManager->getRepository(User::class);
        $user = $userRepository->findBy(
            ['name' => $data['user']]);
            $balance = $user[0]->getBalance();
            
        // Persist and flush the user to the database
        $user[0]->setBalance($balance - $data['betAmount']);
        $entityManager->persist($bet);
        $entityManager->persist($user[0]); 
        $entityManager->flush();


        
        return new JsonResponse(['message' => 'Registration successful'], 200);
    }

    /**
     * @Route("/stats/{teamId}/{lastNgames}/{homeOrAway}/{winLose}/{vsMatchup}/{paceAdjust}/{seasonType}", name="stats")
     */
    public function stats( StatsManager $StatsManager, int $teamId, int $lastNgames, string $homeOrAway, string $winLose, int $vsMatchup,string $paceAdjust, string $seasonType )
    {
        if($homeOrAway=='all'){$homeOrAway='';}
        if($winLose=='all'){$winLose='';}
        $stats= $StatsManager->teamStats($teamId, $lastNgames, $homeOrAway, $winLose, $vsMatchup, $paceAdjust, $seasonType);     
        $response = new JsonResponse(['data' => $stats]);
        $response->headers->set('Access-Control-Allow-Origin', '*');
        return $response;
    }

    /**
     * @Route("/playersStats/{teamId}/{lastNgames}/{homeOrAway}/{winLose}/{vsMatchup}/{paceAdjust}/{seasonType}", name="playersStats")
     */
    public function playersStats( StatsManager $StatsManager, int $teamId, int $lastNgames, string $homeOrAway, string $winLose, int $vsMatchup,string $paceAdjust, string $seasonType )
    {
        if($homeOrAway=='all'){$homeOrAway='';}
        if($winLose=='all'){$winLose='';}
        $stats= $StatsManager->playersStats($teamId, $lastNgames, $homeOrAway, $winLose, $vsMatchup, $paceAdjust, $seasonType);     
        $response = new JsonResponse(['data' => $stats]);
        $response->headers->set('Access-Control-Allow-Origin', '*');
        return $response;
    }

    /**
     * @Route("/graph/{stat}/{playerId}", name="graph")
     */
    public function graph(StatsManager $StatsManager, string $stat, int $playerId)
    {
        $graph=$StatsManager->getGraphStats($stat,$playerId);
        $response = new JsonResponse(['data' => $graph]);
        $response->headers->set('Access-Control-Allow-Origin', '*');
        return $response;
    }
    /**
     * @Route("/injuries/{teamId}", name="injuries")
     */
    public function injuries(StatsManager $StatsManager,int $teamId)
    {
    $injuries = $StatsManager->injury($teamId);
    $response = new JsonResponse(['data' => $injuries]);
    $response->headers->set('Access-Control-Allow-Origin', '*');
    return $response; 
    }

     /**
     * @Route("/simulation/{hTeam}/{aTeam}", name="simulation")
     */
    public function simulation(string $hTeam,string $aTeam)
    {

        $client = new Client();
        $url = 'https://www.nbagamesim.com/nba-game-simulator.asp?HomeTeam=nba'.$hTeam.'&HomeYear=2022&AwayTeam=nba'.$aTeam.'&AwayYear=2022&hs=1&ul=en-us&de=windows-1252&dt=NBA%2520Game%2520Simulator%2520-%2520NBAGameSim.com';
        $crawler = $client->request('GET', $url);
        $count = $crawler->filter('.gs_simcount')->text();
        
        preg_match_all('!\d+!', $crawler->filter('.gs_details2')->text(), $matches);
        if($hTeam!=='76ers')
        {$hWins= intval($matches[0][1]);}else{$hWins= intval($matches[0][2]);};
        $count=intval(substr($count,2));
        $aWins = $count - $hWins; 
        $data['count'] = $count;
        $data['hWins'] = $hWins;
        $data['aWins'] = $aWins;


        $client2 = new Client();
        $crawler2 = $client2->request('GET', 'https://www.pointdevente.parionssport.fdj.fr/');
        $cotes = [];
        $wrapper = $crawler2->filter('.outcomeButton');
        foreach ($wrapper as $cote) {
             if( str_contains($cote->textContent, 'POR TBlazers')){
                array_push($cotes,$cote->textContent);
             }
             if( str_contains($cote->textContent, 'MEM Grizzlies')){
                array_push($cotes,$cote->textContent);
             }
         }
         if(count($cotes)!==0){
        $cote1 = (int)filter_var($cotes[0], FILTER_SANITIZE_NUMBER_INT);
        $cote2 = (int)filter_var($cotes[1], FILTER_SANITIZE_NUMBER_INT);
        $data['hOdds']= $cote1/100;
        $data['aOdds']= $cote2/100;}
        $response = new JsonResponse(['data' => $data]);
        $response->headers->set('Access-Control-Allow-Origin', '*');
        return $response;
    }

}
