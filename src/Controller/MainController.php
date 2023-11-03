<?php

namespace App\Controller;


use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Response;
use Goutte\Client;
use Symfony\Component\HttpFoundation\JsonResponse;

use App\Services\MatchsDeLaNuit;
use App\Services\StatsManager;

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
             if( str_contains($cote->textContent, $hTeam)){
                array_push($cotes,$cote->textContent);
             }
             if( str_contains($cote->textContent, $aTeam)){
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
