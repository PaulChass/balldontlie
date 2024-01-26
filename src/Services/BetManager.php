<?php

namespace App\Services;

use DateTime;
use Symfony\Contracts\Translation\TranslatorInterface;
use App\Entity\User;
use App\Entity\Bet;
use Doctrine\ORM\EntityManagerInterface;


class BetManager
{

    /**
     *
     * 
     *
     **/
    public function checkGames($betRepository, $userRepository, $entityManager)
    {

        $allBets = $betRepository->findby(
            ['status' => 'accepted']
        );
        $statsBets = [];
        $bets=[];
        $i = 0;
        while ( $i < count($allBets)) {
            if ($allBets[$i]->getBetType() !== null) {
                array_push($statsBets, $allBets[$i]);
            }
            else
            {
                array_push($bets,$allBets[$i]);
            }
           $i++;
        }
        
        
        $ids = [];
        for ($i = 0; $i < count($bets); $i++) {
            array_push($ids, '00' . (intval($bets[$i]->getGameId())));
        }
        $ids = array_unique($ids);
        $idsI = array_keys($ids);
        $ids = array_values($ids);


        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => 'http://stats.nba.com/stats/leaguegamefinder/?playerOrTeam=T&leagueId=00&season=2023-24&seasonType=Regular+Season&teamId=&vsTeamId=&playerId=&outcome=&location=&dateFrom=&dateTo=&vsConference=&vsDivision=&conference=&division=&seasonSegment=&poRound=0&starterBench=&gtPts=&gtReb=&gtAst=&gtStl=&gtBlk=&gtOReb=&gtDReb=&gtDD=&gtTD=&gtMinutes=&gtTov=&gtPF=&gtFGM=&gtFGA=&gtFG_Pct=&gtFTM=&gtFTA=&gtFT_Pct=&gtFG3M=&gtFG3A=&gtFG3_Pct=&ltPts=&ltReb=&ltAst=&ltStl=&ltBlk=&ltOReb=&ltDReb=&ltDD=&ltTD=&ltMinutes=&ltTov=&ltPF=&ltFGM=&ltFGA=&ltFG_Pct=&ltFTM=&ltFTA=&ltFT_Pct=&ltFG3M=&ltFG3A=&ltFG3_Pct=&eqPts=&eqReb=&eqAst=&eqStl=&eqBlk=&eqOReb=&eqDReb=&eqDD=&eqTD=&eqMinutes=&eqTov=&eqPF=&eqFGM=&eqFGA=&eqFG_Pct=&eqFTM=&eqFTA=&eqFT_Pct=&eqFG3M=&eqFG3A=&eqFG3_Pct=',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'GET',
            CURLOPT_HTTPHEADER => array(
                'Host:  stats.nba.com',
                'Connection:  keep-alive',
                'Accept:  application/json, text/plain, */*',
                'x-nba-stats-token:  true',
                'User-Agent:  Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36 Edg/88.0.705.74',
                'x-nba-stats-origin:  stats',
                'Origin:  https://www.nba.com',
                'Sec-Fetch-Site:  same-site',
                'Sec-Fetch-Mode:  cors',
                'Sec-Fetch-Dest:  empty',
                'Referer:  https://www.nba.com/',
                'Accept-Encoding:  gzip, deflate, br',
                'Accept-Language:  en-GB,en;q=0.9,en-US;q=0.8',
            ),
        )
        );
        $response = curl_exec($curl);
        $teamsGames = json_decode($response);


        $resId = [];
        $j = 0;
        while ($j < count($ids)) {
            $played = false;
            for ($i = 0; $i < count($teamsGames->resultSets[0]->rowSet) - 1; $i++) {
                if (
                    $teamsGames->resultSets[0]->rowSet[$i][4] ==
                    $ids[$j] &&
                    str_contains($teamsGames->resultSets[0]->rowSet[$i][6], 'vs.')
                ) {
                    $result = [$ids[$j], $teamsGames->resultSets[0]->rowSet[$i][7]];
                    $played = true;
                    array_push($resId, $result);
                }
            }
            if ($played == false) {
                $result = [$ids[$j], 'not played'];
                array_push($resId, $result);
            }
            $j = $j + 1;
        }

        for ($i = 0; $i < count($bets); $i++) {
            $j = 0;
            $betGameId = $bets[$i]->getGameId();
            $notFound = true;
            while ($notFound) {
                if ($betGameId == $resId[$j][0]) {
                    $betResult = $resId[$j][1];
                    $notFound = false;
                } else {
                    $j++;
                }
            }
            $users = $userRepository->findby(
                ['name' => $bets[$i]->getUsername()]
            );

            if ($betResult !== 'not played') {
                if ($bets[$i]->getHomeOrAway() == 0) {
                    if ($betResult == 'W') {
                        $bets[$i]->setStatus('Won');
                        $newBalance = $users[0]->getBalance() + $bets[$i]->getAmount() * $bets[$i]->getOdd();
                        $users[0]->setBalance($newBalance);
                        $entityManager->persist($bets[$i]);
                        $entityManager->persist($users[0]);
                        $entityManager->flush();
                    }
                    if ($betResult == 'L') {
                        $bets[$i]->setStatus('Lost');
                        $entityManager->persist($bets[$i]);
                        $entityManager->flush();
                    }
                }
                if ($bets[$i]->getHomeOrAway() == 1) {
                    if ($betResult == 'L') {
                        $bets[$i]->setStatus('Won');
                        $newBalance = $users[0]->getBalance() + $bets[$i]->getAmount() * $bets[$i]->getOdd();
                        $users[0]->setBalance($newBalance);
                        $entityManager->persist($bets[$i]);
                        $entityManager->persist($users[0]);
                        $entityManager->flush();
                    }
                    if ($betResult == 'W') {
                        $bets[$i]->setStatus('Lost');
                        $entityManager->persist($bets[$i]);
                        $entityManager->flush();
                    }
                }

            }
        }

















        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => 'http://stats.nba.com/stats/leaguegamefinder/?playerOrTeam=P&leagueId=00&season=2023-24&seasonType=Regular+Season&teamId=&vsTeamId=&playerId=&outcome=&location=&dateFrom=&dateTo=&vsConference=&vsDivision=&conference=&division=&seasonSegment=&poRound=0&starterBench=&gtPts=&gtReb=&gtAst=&gtStl=&gtBlk=&gtOReb=&gtDReb=&gtDD=&gtTD=&gtMinutes=&gtTov=&gtPF=&gtFGM=&gtFGA=&gtFG_Pct=&gtFTM=&gtFTA=&gtFT_Pct=&gtFG3M=&gtFG3A=&gtFG3_Pct=&ltPts=&ltReb=&ltAst=&ltStl=&ltBlk=&ltOReb=&ltDReb=&ltDD=&ltTD=&ltMinutes=&ltTov=&ltPF=&ltFGM=&ltFGA=&ltFG_Pct=&ltFTM=&ltFTA=&ltFT_Pct=&ltFG3M=&ltFG3A=&ltFG3_Pct=&eqPts=&eqReb=&eqAst=&eqStl=&eqBlk=&eqOReb=&eqDReb=&eqDD=&eqTD=&eqMinutes=&eqTov=&eqPF=&eqFGM=&eqFGA=&eqFG_Pct=&eqFTM=&eqFTA=&eqFT_Pct=&eqFG3M=&eqFG3A=&eqFG3_Pct=',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'GET',
            CURLOPT_HTTPHEADER => array(
                'Host:  stats.nba.com',
                'Connection:  keep-alive',
                'Accept:  application/json, text/plain, */*',
                'x-nba-stats-token:  true',
                'User-Agent:  Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36 Edg/88.0.705.74',
                'x-nba-stats-origin:  stats',
                'Origin:  https://www.nba.com',
                'Sec-Fetch-Site:  same-site',
                'Sec-Fetch-Mode:  cors',
                'Sec-Fetch-Dest:  empty',
                'Referer:  https://www.nba.com/',
                'Accept-Encoding:  gzip, deflate, br',
                'Accept-Language:  en-GB,en;q=0.9,en-US;q=0.8',
            ),
        )
        );
        $response = curl_exec($curl);
        $obj = json_decode($response);
        $gameIds = [];
        $playerIds = [];
        for ($i = 0; $i < count($statsBets); $i++) {
            array_push($gameIds, '00' . (intval($statsBets[$i]->getGameId())));
            array_push($playerIds, $statsBets[$i]->getPlayerId());
        }
        
        $playerIds = array_values($playerIds);
        $ids = array_values($gameIds);
        for ($i = 0; $i < count($statsBets); $i++) {
            $foundPlayerGame = false;
            $iterator = count($obj->resultSets[0]->rowSet) - 1;

            $users = $userRepository->findby(
                ['name' => $statsBets[$i]->getUsername()]
            );
            
            while ($foundPlayerGame == false && $iterator > 0) {
                if (
                    $obj->resultSets[0]->rowSet[$iterator][2] ==
                    $statsBets[$i]->getGame()
                ) {
                   
                    if ($statsBets[$i]->getStartDate() == $obj->resultSets[0]->rowSet[$iterator][7]) {
                        switch ($bets[$i]->getBetType()) {
                            case 'points':
                                $statIndex = 11;
                                break;

                            case 'rebonds':
                                $statIndex = 23;
                                break;

                            case 'passes':
                                $statIndex = 24;
                                break;

                            case 'interceptions':
                                $statIndex = 25;
                                break;

                            case 'contres':
                                $statIndex = 26;
                                break;

                            case '3pt_pct':
                                $statIndex = 17;
                                break;

                            case 'fg_pct':
                                $statIndex = 14;
                                break;

                            case '+/-':
                                $statIndex = 29;
                                break;

                            default:
                                break;
                        }
                    }
                    $foundPlayerGame = true;


                    if (isset($statIndex)) {
                        if ($statsBets[$i]->getBetTypeValue() >= $obj->resultSets[0]->rowSet[$iterator][$statIndex]) {
                            if ($statsBets[$i]->getHomeOrAway() == 0) { //Bet is Won
                                $statsBets[$i]->setStatus('Won');
                                $newBalance = $users[0]->getBalance() + $statsBets[$i]->getAmount() * $statsBets[$i]->getOdd();
                                $users[0]->setBalance($newBalance);
                                $entityManager->persist($statsBets[$i]);
                                $entityManager->persist($users[0]);
                                $entityManager->flush();
                            } else {
                                //Bet is lost
                                $statsBets[$i]->setStatus('Lost');
                                $entityManager->persist($statsBets[$i]);
                                $entityManager->flush();
                            }
                        } else {
                            if ($statsBets[$i]->getHomeOrAway() == 0) {
                                //Bet is lost
                                $statsBets[$i]->setStatus('Lost');
                                $entityManager->persist($statsBets[$i]);
                                $entityManager->flush();
                            } else {
                                //Bet is won
                                $statsBets[$i]->setStatus('Won');
                                $newBalance = $users[0]->getBalance() + $statsBets[$i]->getAmount() * $statsBets[$i]->getOdd();
                                $users[0]->setBalance($newBalance);
                                $entityManager->persist($statsBets[$i]);
                                $entityManager->persist($users[0]);
                                $entityManager->flush();
                            }
                        }
                    } else {
                        $statsBets[$i]->setStatus('Refunded');
                        $newBalance = $users[0]->getBalance() + $statsBets[$i]->getAmount();
                        $users[0]->setBalance($newBalance);
                        $entityManager->persist($statsBets[$i]);
                        $entityManager->persist($users[0]);
                        $entityManager->flush();
                    }
                }
                $iterator = $iterator - 1;
            }
            echo $foundPlayerGame;
            
            dump($obj->resultSets[0]->rowSet[$iterator+1]);

           
        }




        $betsPending = $betRepository->findby(
            ['status' => 'pending']
        );
        date_default_timezone_set('US/Eastern');
        $today = getdate();
        
        for ($i = 0; $i < count($betsPending); $i++) {
            $betDateArray = explode('-', $betsPending[$i]->getStartDate());
            if ($betDateArray[0] != $today['year'] || $betDateArray[1] != $today['month'] || $betDateArray[2] != $today['day']) {
                $betsPending[$i]->setStatus('not accepted');
                $users = $userRepository->findby(
                    ['name' => $betsPending[$i]->getUsername()]
                );
                $newBalance = $users[0]->getBalance() + $betsPending[$i]->getAmount();
                $users[0]->setBalance($newBalance);
                $entityManager->persist($users[0]);
                $entityManager->persist($betsPending[$i]);
                $entityManager->flush();
            }

        }

        echo "ok";
    }

}
