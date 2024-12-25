<?php

namespace App\Services;

use Symfony\Contracts\Translation\TranslatorInterface;


class StatsManager
{



    /**
     * Renvoi un tableau des moyennes statistique pour l'équipe donné
     *
     * @uses returnStats()
     * @uses curl()
     * 
     * 
     * @return array
     *     tableau avec stats des équipes à domicile et à l'exterieur ainsi que la date
     *     
     **/
    public function teamStats($teamId, $lastNgames, $location, $outcome, $opponentTeamId, $paceAdjust, $seasonType, $measureType)
    {
       if($measureType=='Base'){ 
        $teamsStatsJson = $this->curl('team', $teamId, $lastNgames, $location, $outcome, $opponentTeamId, $paceAdjust, $seasonType, $measureType);
        $teamsStats = json_decode($teamsStatsJson);}
        else{
            $defStatsJson = $this->curl('team', $teamId, $lastNgames, $location, $outcome, $opponentTeamId, $paceAdjust, $seasonType, 'Defense');
            $defStats = json_decode($defStatsJson);
            $advancedStatsJson = $this->curl('team', $teamId, $lastNgames, $location, $outcome, $opponentTeamId, $paceAdjust, $seasonType, 'Advanced');
            $advancedStats = json_decode($advancedStatsJson);
        }

        
        

        if($measureType=='Base'){
           $teamStats = $this->returnStats($teamId, $teamsStats, null);
           return $teamStats;}
        else{
            $defteamsStats = $this->returnDefenseStats($teamId,$defStats);
            $advancedStats = $this->returnAdvancedStats($teamId,$advancedStats);
            $teamsStats= $defteamsStats+$advancedStats;
            return $teamsStats;
        }  
    }

    
    public function playersStats($teamId,$lastNgames,$location,$outcome,$opponentTeamId,$paceAdjust,$seasonType)
    {
        $playersStatsJson = $this->curl('player',$teamId,$lastNgames,$location,$outcome,$opponentTeamId,$paceAdjust,$seasonType);
        $playersStats=json_decode($playersStatsJson);
        if($playersStats->resultSets[0]->rowSet==[])
        {
            $playersStatsJson = $this->curl('player',$teamId,0);
            $playersStats=json_decode($playersStatsJson);
            $playerStats=$this->returnPlayerStats($playersStats,$teamId);
            $playerStats['error']="Aucun résultat trouver pour les critères selectionnés";
            return $playerStats;
            }
        $playerStats=$this->returnPlayerStats($playersStats,$teamId);
       
        return $playerStats;
    } 

    /**
     * Renvoi un tableau des moyennes statistique pour l'équipe donné
     * 
     * @return array
     * 
     * @uses curl()
     *     tableau avec stats des équipes à domicile et à l'exterieur ainsi que la date
     *     
     **/
    public function returnStats($teamId, $teamsStats, $defTeamsStats)
    {

        $i = 0;
        
        $teamStatsId[] = $teamsStats->resultSets[0]->rowSet;
        while ($teamStatsId[0][$i][0] != $teamId) {
            $i++;
        }

        $stats['Team'] = $teamStatsId[0][$i][1];
        $stats['team_abv'] = $this->getAbvFromId($teamId);
        $stats['team_id'] = $teamStatsId[0][$i][0];
        $stats['points'] = $teamStatsId[0][$i][26];
        $stats['pointsTaken'] = $teamStatsId[0][$i][26]-$teamStatsId[0][$i][27];
        $stats['minutes'] = $teamStatsId[0][$i][6];
        $stats['pointsRank'] = $teamStatsId[0][$i][52];
        $stats['rebounds'] = $teamStatsId[0][$i][18];
        $stats['reboundsRank'] = $teamStatsId[0][$i][44];
        $stats['assists'] = $teamStatsId[0][$i][19];
        $stats['assistsRank'] = $teamStatsId[0][$i][45];
        $stats['blocks'] = $teamStatsId[0][$i][22];
        $stats['blocksRank'] = $teamStatsId[0][$i][48];
        $stats['steals'] = $teamStatsId[0][$i][21];
        $stats['stealsRank'] = $teamStatsId[0][$i][47];
        $stats['fg_pct'] = $teamStatsId[0][$i][9];
        $stats['fg_pctRank'] = $teamStatsId[0][$i][35];
        $stats['three_fg_pct'] = $teamStatsId[0][$i][12];
        $stats['three_fg_pctRank'] = $teamStatsId[0][$i][38];
        $stats['three_attempts'] = $teamStatsId[0][$i][11];
        $stats['three_attemptsRank'] = $teamStatsId[0][$i][37];
        if (isset($defTeamsStats)) {
            $j = 0;
            while ($defTeamsStats->resultSets[0]->rowSet[$j][0] != $teamId) {
                $j++;
            }
            $stats['d_fg_pct'] = $defTeamsStats->resultSets[0]->rowSet[$j][8];
            $rank = 1;
            for ($k = 0; $k < count($defTeamsStats->resultSets[0]->rowSet); $k++) {
                if ($defTeamsStats->resultSets[0]->rowSet[$k][8] <= $stats['d_fg_pct']) {
                    $rank++;
                }
            }
            $stats['d_fg_pctRank'] = $rank;
        }
        $stats['turnovers'] = $teamStatsId[0][$i][20];
        $stats['turnoversRank'] = $teamStatsId[0][$i][46];
        $stats['wins'] =  $teamStatsId[0][$i][3];
        $stats['losses'] = $teamStatsId[0][$i][4];
        $stats['Rank'] = $teamStatsId[0][$i][31];

        return $stats;
    }


    public function returnDefenseStats($teamId, $teamsStats){
        $i = 0;
        $teamStatsId[] = $teamsStats->resultSets[0]->rowSet;
        while ($teamStatsId[0][$i][0] != $teamId) {
            $i++;
        }
        $stats['Team'] = $teamStatsId[0][$i][1];
        $stats['team_abv'] = $this->getAbvFromId($teamId);
        $stats['team_id'] = $teamStatsId[0][$i][0];
        $stats['def_rating'] = $teamStatsId[0][$i][7];
        $stats['steals']= $teamStatsId[0][$i][10];
        $stats['blocks']= $teamStatsId[0][$i][11];
        $stats['OPP_PTS_OFF_TOV'] = $teamStatsId[0][$i][12];
        $stats['OPP_PTS_2ND_CHANCE'] = $teamStatsId[0][$i][13];
        $stats['OPP_PTS_FB'] = $teamStatsId[0][$i][14];
        $stats['OPP_PTS_PAINT'] = $teamStatsId[0][$i][15];

        return $stats;
    }
    
    public function returnAdvancedStats($teamId, $teamsStats){
        $i = 0;
        $teamStatsId[] = $teamsStats->resultSets[0]->rowSet;
        while ($teamStatsId[0][$i][0] != $teamId) {
            $i++;
        }
        $stats['OFF_RATING'] = $teamStatsId[0][$i][8];
        $stats['DEF_RATING']= $teamStatsId[0][$i][10];
        $stats['NET_RATING']= $teamStatsId[0][$i][12];
        $stats['PACE'] = $teamStatsId[0][$i][23];
        $stats['EFG_PCT'] = $teamStatsId[0][$i][20];
        $stats['TS_PCT'] = $teamStatsId[0][$i][21];
        $stats['AST_PCT'] = $teamStatsId[0][$i][13];
        $stats['AST_TO'] = $teamStatsId[0][$i][14];
        $stats['OREB_PCT'] = $teamStatsId[0][$i][16];
        $stats['DREB_PCT'] = $teamStatsId[0][$i][17];


        return $stats;
    }


    public function getAbvFromId($id)
    {
        $playerStatsJson = $this->curl('player',$id,0);
        $playerStats = json_decode($playerStatsJson);
       
        
        $i=0;
        while ($playerStats->resultSets[0]->rowSet[$i][3] !=$id) {
            $i++;
        }
        return $playerStats->resultSets[0]->rowSet[$i][4];
    }
    
    public function returnPlayerStats($playersStats,$teamId)
    {
        $players=[];$player=[];
        for ($i=0; $i < count($playersStats->resultSets[0]->rowSet) ; $i++) { 
            if ($playersStats->resultSets[0]->rowSet[$i][3]==$teamId)
                {
                    $player['teamAbv']=$playersStats->resultSets[0]->rowSet[$i][4];
                    $player['teamId']=$playersStats->resultSets[0]->rowSet[$i][3];
                    $player['id']=$playersStats->resultSets[0]->rowSet[$i][0];
                    $player['name']=$playersStats->resultSets[0]->rowSet[$i][1];
                    $player['games']=$playersStats->resultSets[0]->rowSet[$i][6];
                    $player['wins']=$playersStats->resultSets[0]->rowSet[$i][7];
                    $player['losses']=$playersStats->resultSets[0]->rowSet[$i][8];
                    $player['minutes']=$playersStats->resultSets[0]->rowSet[$i][10];
                    $player['minutesRank']=$playersStats->resultSets[0]->rowSet[$i][39];
                    $player['points']=$playersStats->resultSets[0]->rowSet[$i][30];
                    $player['pointsRank']=$playersStats->resultSets[0]->rowSet[$i][59];
                    $player['rebounds']=$playersStats->resultSets[0]->rowSet[$i][22];
                    $player['reboundsRank']=$playersStats->resultSets[0]->rowSet[$i][51];
                    $player['assists']=$playersStats->resultSets[0]->rowSet[$i][23];
                    $player['assistsRank']=$playersStats->resultSets[0]->rowSet[$i][52];
                    $player['turnovers']=$playersStats->resultSets[0]->rowSet[$i][24];
                    $player['turnoversRank']=$playersStats->resultSets[0]->rowSet[$i][53];
                    $player['steals']=$playersStats->resultSets[0]->rowSet[$i][25];
                    $player['stealsRank']=$playersStats->resultSets[0]->rowSet[$i][54];
                    $player['blocks']=$playersStats->resultSets[0]->rowSet[$i][26];
                    $player['blocksRank']=$playersStats->resultSets[0]->rowSet[$i][55];
                    $player['plusminus']=$playersStats->resultSets[0]->rowSet[$i][31];
                    $player['plusminusRank']=$playersStats->resultSets[0]->rowSet[$i][60];
                    $player['fg_pct']=$playersStats->resultSets[0]->rowSet[$i][13];
                    $player['fg_pctRank']=$playersStats->resultSets[0]->rowSet[$i][42];
                    $player['three_fg_pct']=$playersStats->resultSets[0]->rowSet[$i][16];  
                    $player['three_fg_pctRank']=$playersStats->resultSets[0]->rowSet[$i][45];   
                    array_push($players,$player);
                }
        }
      
        usort($players, function($a, $b) {
            return $a['minutes'] <=> $b['minutes'];
        });
        return array_reverse($players);
    }
    
    public function curl($teamOrplayer, $teamId, $lastNgames, $location = '', $outcome = '', $opponentTeamId = 0, $paceAdjust = 'N', $seasonType = 'Regular+Season', $measureType='Base')
    {

        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://stats.nba.com/stats/leaguedash' . $teamOrplayer . 'stats?College=&Conference=&Country=&DateFrom=&DateTo=&Division=&DraftPick=&DraftYear=&GameScope=&GameSegment=&Height=&LastNGames=' . $lastNgames . '&LeagueID=00&Location=' . $location . '&MeasureType='.$measureType.'&Month=0&OpponentTeamID=' . $opponentTeamId . '&Outcome=' . $outcome . '&PORound=0&PaceAdjust=' . $paceAdjust . '&PerMode=PerGame&Period=0&PlayerExperience=&PlayerPosition=&PlusMinus=N&Rank=N&Season=2024-25&SeasonSegment=&SeasonType=' . $seasonType . '&ShotClockRange=&StarterBench=&TeamID=' . $teamId . '&TwoWay=0&VsConference=&VsDivision=&Weight=',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 10000,
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
        ));

        $response = curl_exec($curl);

        curl_close($curl);
        return $response;
    }

    public function getGraphStats($stat,$playerId)
    {

        $curl = curl_init();

        curl_setopt_array($curl, array(
        CURLOPT_URL => 'http://stats.nba.com/stats/leaguegamefinder/?playerOrTeam=P&leagueId=00&season=2024-25&seasonType=Regular+Season&teamId=&vsTeamId=&playerId='.$playerId.'&outcome=&location=&dateFrom=&dateTo=&vsConference=&vsDivision=&conference=&division=&seasonSegment=&poRound=0&starterBench=&gtPts=&gtReb=&gtAst=&gtStl=&gtBlk=&gtOReb=&gtDReb=&gtDD=&gtTD=&gtMinutes=&gtTov=&gtPF=&gtFGM=&gtFGA=&gtFG_Pct=&gtFTM=&gtFTA=&gtFT_Pct=&gtFG3M=&gtFG3A=&gtFG3_Pct=&ltPts=&ltReb=&ltAst=&ltStl=&ltBlk=&ltOReb=&ltDReb=&ltDD=&ltTD=&ltMinutes=&ltTov=&ltPF=&ltFGM=&ltFGA=&ltFG_Pct=&ltFTM=&ltFTA=&ltFT_Pct=&ltFG3M=&ltFG3A=&ltFG3_Pct=&eqPts=&eqReb=&eqAst=&eqStl=&eqBlk=&eqOReb=&eqDReb=&eqDD=&eqTD=&eqMinutes=&eqTov=&eqPF=&eqFGM=&eqFGA=&eqFG_Pct=&eqFTM=&eqFTA=&eqFT_Pct=&eqFG3M=&eqFG3A=&eqFG3_Pct=',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 8000,
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
        ));

        $response = curl_exec($curl);

        curl_close($curl);
        $playersGames = json_decode($response)->resultSets[0]->rowSet;
        for ($i=0; $i < count($playersGames); $i++) { 
            $label[$i]= substr($playersGames[$i][8],3) .'( '.substr($playersGames[$i][7],-2).'/'.substr($playersGames[$i][7],5,2).' )';
            
            switch ($stat) {
                case 'fg_pct':
                    $graph['stat']='% Tir';
                    $value[$i]=  $playersGames[$i][14];
                    break;
                case '3pt_pct':
                    $graph['stat']='% Tir 3pts';
                    $value[$i]=  $playersGames[$i][17];
                    break;
                case 'rebonds':
                    $graph['stat']='Rebonds par match';
                    $value[$i]=  $playersGames[$i][23];
                    break;
                case 'passes':
                    $graph['stat']='Passes decisives';
                    $value[$i]=  $playersGames[$i][24];
                    break; 
                case 'turnovers':
                    $graph['stat']='Pertes de balle';
                    $value[$i]=  $playersGames[$i][27];
                    break;  
                case 'interceptions':
                    $graph['stat']='Interceptions ';
                    $value[$i]=  $playersGames[$i][25];
                    break; 
                case 'contres':
                    $graph['stat']='Contres par match';
                    $value[$i]=  $playersGames[$i][26];
                    break; 
                case '+/-':
                    $graph['stat']='Plus/minus';
                    $value[$i]=  $playersGames[$i][29];
                    break;  
                case 'minutes':
                        $graph['stat']='Minutes par match';
                        $value[$i]=  $playersGames[$i][10];
                        break; 
                        
                case 'points':
                        $graph['stat']='Points par match';
                    $value[$i]=  $playersGames[$i][11];
                default:
                    
                    break;
            }
            $graph['title']=$playersGames[$i][2];

        }
      
        $graph['label']=array_reverse(array_slice($label, 0, 5));
        $graph['value']=array_reverse(array_slice($value, 0, 5));
        
        return $graph;
    }



    public function injury($teamId){
     
        $curl = curl_init();
    
        curl_setopt_array($curl, array(
          CURLOPT_URL => 'https://www.rotowire.com/basketball/tables/injury-report.php?team=ALL&pos=ALL',
          CURLOPT_RETURNTRANSFER => true,
          CURLOPT_ENCODING => '',
          CURLOPT_MAXREDIRS => 10,
          CURLOPT_TIMEOUT => 0,
          CURLOPT_FOLLOWLOCATION => true,
          CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
          CURLOPT_CUSTOMREQUEST => 'GET',
          CURLOPT_HTTPHEADER => array(
          ),
        ));
        
        $response = curl_exec($curl);
        
        curl_close($curl);
        $injuredPlayers = json_decode($response);
        $team_abv=$this -> getAbvFromId($teamId);
        $infirmerie=[];$injury= [];
        for ($i=0; $i < count($injuredPlayers); $i++) { 
                if($injuredPlayers[$i]->team ==$team_abv){
                        $injury['player']=$injuredPlayers[$i]->player;
                        $injury['injury']=$injuredPlayers[$i]->injury;
                        $injury['status']=$injuredPlayers[$i]->status;
                        array_push($infirmerie,$injury);
                }
            }
            return $infirmerie;
        }

    public function twitter($teamId){
        $team_abv=$this -> getAbvFromId($teamId);
        $leagueTwitters=[
            'CHI'=>'https://twitter.com/chicagobulls?s=20',
            'IND'=>'https://twitter.com/Pacers?s=20',
            'NOP'=>'https://twitter.com/PelicansNBA?s=20',
            'MIA'=>'https://twitter.com/MiamiHEAT?s=20',
            'ORL'=>'https://twitter.com/OrlandoMagic?s=20',
            'MIL'=>'https://twitter.com/Bucks?s=20',
            'MIN'=>'https://twitter.com/Timberwolves?s=20',
            'DAL'=>'https://twitter.com/dallasmavs?s=20',
            'LAL'=>'https://twitter.com/Lakers?s=20',
            'LAC'=>'https://twitter.com/laclippers',
            'CHA'=>'https://twitter.com/hornets?s=20',
            'WAS'=>'https://twitter.com/WashWizards?s=20',
            'OKC'=>'https://twitter.com/okcthunder?s=20',
            'NYK'=>'https://twitter.com/nyknicks?s=20',
            'DET'=>'https://twitter.com/DetroitPistons?s=20',
            'UTA'=>'https://twitter.com/utahjazz?s=20',
            'BOS'=>'https://twitter.com/celtics?s=20',
            'ATL'=>'https://twitter.com/ATLHawks?s=20',
            'SAS'=>'https://twitter.com/spurs?s=20',
            'PHI'=>'https://twitter.com/sixers?s=20',
            'BKN'=>'https://twitter.com/BrooklynNets?s=20',
            'CLE'=>'https://twitter.com/cavs?s=20',
            'TOR'=>'https://twitter.com/Raptors?s=20',
            'MEM'=>'https://twitter.com/memgrizz?s=20',
            'POR'=>'https://twitter.com/trailblazers?s=20',
            'PHX'=>'https://twitter.com/Suns?s=20',
            'GSW'=>'https://twitter.com/warriors?s=20',
            'SAC'=>'https://twitter.com/SacramentoKings?s=20',
            'HOU'=>'https://twitter.com/HoustonRockets?s=20',
            'DEN'=>'https://twitter.com/nuggets?s=20'
        ];
        $twitter=$leagueTwitters[$team_abv];
        return $twitter;
    }

    
    public function checkGameResult($gameId,$game,$homeOrAway)
    {
        $names = explode("@", $game); 
        $teamName = $names[$homeOrAway];
        $gameId = intval('00'.$gameId);
        
        $curl = curl_init();
        curl_setopt_array($curl, array(
        CURLOPT_URL => 'http://stats.nba.com/stats/leaguegamefinder/?gameID='.$gameId.'playerOrTeam=T&leagueId=00&season=2024-25&seasonType=Regular+Season&teamId=&vsTeamId=&playerId=&outcome=&location=&dateFrom=&dateTo=&vsConference=&vsDivision=&conference=&division=&seasonSegment=&poRound=0&starterBench=&gtPts=&gtReb=&gtAst=&gtStl=&gtBlk=&gtOReb=&gtDReb=&gtDD=&gtTD=&gtMinutes=&gtTov=&gtPF=&gtFGM=&gtFGA=&gtFG_Pct=&gtFTM=&gtFTA=&gtFT_Pct=&gtFG3M=&gtFG3A=&gtFG3_Pct=&ltPts=&ltReb=&ltAst=&ltStl=&ltBlk=&ltOReb=&ltDReb=&ltDD=&ltTD=&ltMinutes=&ltTov=&ltPF=&ltFGM=&ltFGA=&ltFG_Pct=&ltFTM=&ltFTA=&ltFT_Pct=&ltFG3M=&ltFG3A=&ltFG3_Pct=&eqPts=&eqReb=&eqAst=&eqStl=&eqBlk=&eqOReb=&eqDReb=&eqDD=&eqTD=&eqMinutes=&eqTov=&eqPF=&eqFGM=&eqFGA=&eqFG_Pct=&eqFTM=&eqFTA=&eqFT_Pct=&eqFG3M=&eqFG3A=&eqFG3_Pct=',
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
        ));
        $response = curl_exec($curl);
        $obj = json_decode($response);
        for ($j=0; $j < count($obj->resultSets[0]->rowSet); $j++) { 
            if($obj->resultSets[0]->rowSet[$j][4]==$gameId ){
                if($obj->resultSets[0]->rowSet[$j][3]==$teamName){
                    return 'w';}
                else {
                    return 'l';}
            
            }
        }
        return 'n';
    }




    public function lastNightResults(){
        $curl = curl_init();
        curl_setopt_array($curl, array(
            CURLOPT_URL => 'http://stats.nba.com/stats/leaguegamefinder/?playerOrTeam=T&leagueId=00&season=2024-25&seasonType=Regular+Season&teamId=&vsTeamId=&playerId=&outcome=&location=&dateFrom=&dateTo=&vsConference=&vsDivision=&conference=&division=&seasonSegment=&poRound=0&starterBench=&gtPts=&gtReb=&gtAst=&gtStl=&gtBlk=&gtOReb=&gtDReb=&gtDD=&gtTD=&gtMinutes=&gtTov=&gtPF=&gtFGM=&gtFGA=&gtFG_Pct=&gtFTM=&gtFTA=&gtFT_Pct=&gtFG3M=&gtFG3A=&gtFG3_Pct=&ltPts=&ltReb=&ltAst=&ltStl=&ltBlk=&ltOReb=&ltDReb=&ltDD=&ltTD=&ltMinutes=&ltTov=&ltPF=&ltFGM=&ltFGA=&ltFG_Pct=&ltFTM=&ltFTA=&ltFT_Pct=&ltFG3M=&ltFG3A=&ltFG3_Pct=&eqPts=&eqReb=&eqAst=&eqStl=&eqBlk=&eqOReb=&eqDReb=&eqDD=&eqTD=&eqMinutes=&eqTov=&eqPF=&eqFGM=&eqFGA=&eqFG_Pct=&eqFTM=&eqFTA=&eqFT_Pct=&eqFG3M=&eqFG3A=&eqFG3_Pct=',
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
        $sameDay = true;
        $iterator = 0;
        $games = [];
        $game = [];
        while ($sameDay) {
            $game['matchup'] = $teamsGames->resultSets[0]->rowSet[$iterator][6];
            $game['homeScore'] = $teamsGames->resultSets[0]->rowSet[$iterator][9];
          //  $game['homeName'] = $teamsGames->resultSets[0]->rowSet[$iterator][4];
            $game['awayScore'] = $teamsGames->resultSets[0]->rowSet[$iterator][9] - $teamsGames->resultSets[0]->rowSet[$iterator][27];
            $game['gameId'] = $teamsGames->resultSets[0]->rowSet[$iterator][4];
            if(str_contains($teamsGames->resultSets[0]->rowSet[$iterator][6],'@')){
                $i =0 ;
                $gameNotFound = true; 
                while($gameNotFound){
                    if($teamsGames->resultSets[0]->rowSet[$i][4] == $game['gameId'] && $i !== $iterator){
                        $gameNotFound = false;
                    } else { 
                        $i++;
                    }
                }
                $game['awayScore'] = $teamsGames->resultSets[0]->rowSet[$i][9];
                array_push($games,$game);}
            if($teamsGames->resultSets[0]->rowSet[$iterator][5] !== $teamsGames->resultSets[0]->rowSet[$iterator+1][5])
            {
                $sameDay = false;
            }
            $iterator++;
        }
      
        return $games;
    }
}
