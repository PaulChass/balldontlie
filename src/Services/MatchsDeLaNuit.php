<?php
namespace App\Services;

use App\Nba\NbaClient;

class MatchsDeLaNuit
{
    private NbaClient $nbaClient;

    /** Mémoïsation du calendrier pour éviter de le re-télécharger plusieurs fois par requête. */
    private ?object $scheduleCache = null;

    public function __construct(NbaClient $nbaClient)
    {
        $this->nbaClient = $nbaClient;
    }

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
        if ($schedule === null || !isset($schedule->leagueSchedule->gameDates)) {
            return $tonightGames;
        }
        $gameDates = $schedule->leagueSchedule->gameDates;

        $found = false;
        $safety = 0;

        // Borne de sécurité : au-delà de 30 itérations (jours) sans match trouvé,
        // on s'arrête au lieu de boucler indéfiniment (intersaison, API HS, etc.).
        while (!$found && $safety < 30) {
            $safety++;
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
        if ($schedule === null || !isset($schedule->leagueSchedule->gameDates)) {
            return [];
        }
        $gameDates = $schedule->leagueSchedule->gameDates;
        $match = [];
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
        if ($this->scheduleCache !== null) {
            return $this->scheduleCache;
        }

        // cdn.nba.com (Akamai) renvoie 403 sans en-tête User-Agent navigateur :
        // sans lui, getJson() reçoit un 403, renvoie null, et la page d'accueil
        // se retrouve sans matchs. L'ancien cookie Akamai codé en dur (2021) était
        // expiré et inutile.
        $this->scheduleCache = $this->nbaClient->getJsonCached(
            'nba_schedule_league_v2',
            'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json',
            [
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept: application/json, text/plain, */*',
                'Origin: https://www.nba.com',
                'Referer: https://www.nba.com/',
            ],
            60
        );

        return $this->scheduleCache;
    }
}