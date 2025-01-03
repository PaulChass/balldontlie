<?php
namespace App\Services;

class MatchsDeLaNuit
{
    /**
     * Retourne la liste des matchs de la nuit NBA 
     *
     * @param int $day
     * @return array
     *     tableau avec noms et id des équipes à domicile et à l'exterieur ainsi que la date
     **/
    public function MatchsDeLaNuit($day = 0)
    {
        date_default_timezone_set('America/New_York');

        $dateVal = date_create("Now");
        $tonightGames = [];

        $schedule = $this->schedule();
        $gameDates = $schedule->leagueSchedule->gameDates;

        $found = false;

        while (!$found) {
            $dateET = date_format($dateVal, "m/d/Y");

            foreach ($gameDates as $gameDate) {
                if ($this->isSameDate($gameDate->gameDate, $dateET)) {
                    $found = true;
                    foreach ($gameDate->games as $game) {
                        $tonightGames[] = $this->processGame($game);
                    }
                }
            }

            date_add($dateVal, date_interval_create_from_date_string("1 days"));
        }

        return $tonightGames;
    }

    /**
     * Vérifie si deux dates sont identiques
     *
     * @param string $gameDate
     * @param string $dateET
     * @return bool
     **/
    private function isSameDate($gameDate, $dateET)
    {
        $gameDateTime = preg_split('/ +/', $gameDate);
        return $gameDateTime[0] === $dateET;
    }

    /**
     * Traite les informations d'un match
     *
     * @param object $game
     * @return array
     **/
    private function processGame($game)
    {
        $gamedate = $game->gameDateTimeUTC ?? '0000-00-00T00:00:00'; // Default value if null
        $time = $this->convertTime($gamedate);

        $match = [
            'GameId' => $game->gameId,
            'HomeTeamId' => $game->homeTeam->teamId,
            'HomeLogoUrl' => 'https://cdn.nba.com/logos/nba/' . $game->homeTeam->teamId . '/global/L/logo.svg',
            'AwayTeamId' => $game->awayTeam->teamId,
            'AwayLogoUrl' => 'https://cdn.nba.com/logos/nba/' . $game->awayTeam->teamId . '/global/L/logo.svg',
            'status' => $game->gameStatus,
            'statusText' => $game->gameStatusText,
            'startTime' => $this->getStartTime($game->gameStatus, $game->gameStatusText),
            'day' => explode('T', $game->gameDateUTC ?? '0000-00-00T00:00:00')[0], // Default value if null
            'homeScore' => $game->homeTeam->score,
            'awayScore' => $game->awayTeam->score,
            'id' => null,
            'Time' => $time,
        ];

        return $match;
    }

    /**
     * Convertit l'heure UTC en heure locale
     *
     * @param string $gamedate
     * @return string
     **/
    private function convertTime($gamedate)
    {
        if ($gamedate === null) {
            return '00:00'; // Default value or handle the null case appropriately
        }
        $hourUTC = (int) substr($gamedate, 11, 2); 
        $hourFR = ($hourUTC + 1) % 24;
        $minutes = substr($gamedate, 14, 2);
        return sprintf('%02d:%s', $hourFR, $minutes);
    }

    /**
     * Obtient l'heure de début du match
     *
     * @param int $status
     * @param string $statusText
     * @return array|null
     **/
    private function getStartTime($status, $statusText)
    {
        if ($status == 1) {
            if (str_contains($statusText, 'pm')) {
                return $this->convertPmTime($statusText);
            } elseif (str_contains($statusText, 'am')) {
                return $this->convertAmTime($statusText);
            }
        }
        return null;
    }

    /**
     * Convertit l'heure PM en heure locale
     *
     * @param string $statusText
     * @return array
     **/
    private function convertPmTime($statusText)
    {
        $pieces = explode("pm", $statusText);
        $hourMinutes = explode(":", $pieces[0]);
        $hour = (intval($hourMinutes[0]) + 12 + 6) % 24;
        $minutes = $hourMinutes[1];
        return [$hour, $minutes];
    }

    /**
     * Convertit l'heure AM en heure locale
     *
     * @param string $statusText
     * @return array
     **/
    private function convertAmTime($statusText)
    {
        $pieces = explode("am", $statusText);
        $hourMinutes = explode(":", $pieces[0]);
        $hour = (intval($hourMinutes[0]) + 6) % 24;
        $minutes = $hourMinutes[1];
        return [$hour, $minutes];
    }

    /**
     * Retourne les IDs des équipes pour un match donné
     *
     * @param string $gameId
     * @return array
     **/
    public function TeamsId($gameId)
    {
        $schedule = $this->schedule();
        $gameDates = $schedule->leagueSchedule->gameDates;
        for ($i = 0; $i < count($gameDates); $i++) {
            for ($j = 0; $j < count($gameDates[$i]->games); $j++) {
                if ($gameDates[$i]->games[$j]->gameId == $gameId) {
                    $match = [$gameDates[$i]->games[$j]->homeTeam->teamId, $gameDates[$i]->games[$j]->awayTeam->teamId];
                }
            }
        }
        return $match;
    }

    /**
     * Récupère le calendrier des matchs depuis l'API NBA
     *
     * @return object
     **/
    protected function schedule()
    {
        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json',
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