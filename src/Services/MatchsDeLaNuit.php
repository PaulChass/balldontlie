<?php
namespace App\Services;

use Symfony\Component\DomCrawler\Crawler;

class MatchsDeLaNuit 
{
    /**
 * Retourne la liste des matchs de la nuit NBA 
 *
 * @uses getAbvFromTeam()  
 *
 * 
 * @return array
 *     tableau avec noms et id des équipes à domicile et à l'exterieur ainsi que la date
 *     
**/
    public function MatchsDeLaNuit($day=0)
    {       
        date_default_timezone_set('America/New_York'); 
        

        $date=getdate(); 
        $dateVal = date_create("Now");
        
        $currentHour = date('H');
        $currentMinutes = date('i');
      
        $tonightGames=[];
        
        $schedule=$this->schedule();
        $gameDates=$schedule->leagueSchedule->gameDates;
        if(strlen($date['mon'])==1){$date['mon']= "0".$date['mon'];}
        if(strlen($date['mday'])==1){$date['mday']= "0".$date['mday'];}
        $found= false;
        
        
        while($found==false){
        $dateET = date_format($dateVal, "m/d/Y");
        //only for offseason 
        //$dateET = '12/25/2022';

        for ($i=0; $i < count($gameDates); $i++) { 
                $gameDateTime = preg_split('/ +/', $gameDates[$i]->gameDate );  
                if($gameDateTime[0]==$dateET){
                    $found = true;
                    for ($j=0; $j < count($gameDates[$i]->games); $j++) { 
                        $games = $gameDates[$i]->games;
                        
                        $gamedate=$games[$j]->gameDateTimeUTC;

                            $hourUTC = substr($gamedate, 11, 2); // time UTC
                            $hourFR= $hourUTC+1; 
                            if($hourFR==24){
                                $hourFR='00';
                            }
                            if($hourFR==25){
                                $hourFR='1';
                            }
                            $minutes = substr($gamedate, 14, 2);
                            $time = $hourFR.':'.$minutes;

                            $match['GameId']=$games[$j]->gameId;
                            $match['HomeTeamId']= $games[$j]->homeTeam->teamId;
                            $match['HomeLogoUrl']= 'https://cdn.nba.com/logos/nba/'.$games[$j]->homeTeam->teamId.'/global/L/logo.svg';
                                
                            $match['AwayTeamId']= $games[$j]->awayTeam->teamId;
                                $match['AwayLogoUrl']= 'https://cdn.nba.com/logos/nba/'.$games[$j]->awayTeam->teamId.'/global/L/logo.svg';
                                $match['status']= $games[$j]->gameStatus;
                                $match['statusText']= $games[$j]->gameStatusText;
                                if($match['status']==1){
                                    if (str_contains($match['statusText'], 'pm')) { 
                                        $pieces = explode("pm", $match['statusText']);
                                        $hourMinutes = explode(":", $pieces[0]);
                                        $hour = intval($hourMinutes[0])+12+6;
                                        if($hour >= 24 ){$hour = $hour-24;}                                        
                                        $minutes = $hourMinutes[1];
                                        $match['startTime']=[$hour,$minutes];}
                                    } elseif (str_contains($match['statusText'], 'am')) {
                                        $pieces = explode("pm", $match['statusText']);
                                        $hourMinutes = explode(":", $pieces[0]);
                                        $hour = intval($hourMinutes[0])+6;
                                        $minutes = $hourMinutes[1];  
                                        $match['startTime']=[$hour,$minutes];                                 
                                    }   
                                        
                                $gameDateUTC = explode('T',$games[$j]->gameDateUTC);
                                $match['day']=$gameDateUTC[0];

                                $match['homeScore']= $games[$j]->homeTeam->score;
                                $match['awayScore']= $games[$j]->awayTeam->score;
                                $match['id']=null;
                                date_default_timezone_set('Europe/London'); 
                                $match['Time']= $time;

                                array_push($tonightGames,$match);

                        
                    }
                        date_default_timezone_set('America/Los_Angeles');
                }
                        //$match['Time']=date('H:i', mktime(date('H', strtotime($gamedate)),date('i', strtotime($gamedate))));
              
            }
            date_add($dateVal, date_interval_create_from_date_string("1 days"));        }
        return $tonightGames;
    }

    public function TeamsId($gameId)
    {
        $schedule=$this->schedule();
        $gameDates=$schedule->leagueSchedule->gameDates;
        for ($i=0; $i < count($gameDates); $i++) { 
            for ($j=0; $j < count($gameDates[$i]->games); $j++) { 
                if($gameDates[$i]->games[$j]->gameId== $gameId)
                {
                    $match = [$gameDates[$i]->games[$j]->homeTeam->teamId,$gameDates[$i]->games[$j]->awayTeam->teamId];
                }
          }
        }
        return $match;
    }
   
    

    private function schedule()
    {
        $curl = curl_init();

        curl_setopt_array($curl, array(
        CURLOPT_URL => 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_9.json',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 0,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'GET',
        CURLOPT_HTTPHEADER => array(
            'Cookie: akacd_data_nba_net_ems=1616059329~rv=14~id=f99c4dca08f89687c039a759f2256383'
        ),
        ));

        $response = curl_exec($curl);

        curl_close($curl);

        return json_decode($response);
    }
}
