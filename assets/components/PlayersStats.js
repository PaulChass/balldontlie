import React from 'react';
import PlayersStatArray from './PlayersStatArray';
import TeamsStatsButtonBar from './TeamsStatsButtonBar';
import { useState } from 'react';


function PlayersStats(props) {

    const [lastNgames, setLastNGames] = useState('0');
    const [homeOrAway, setHomeOrAway] = useState('all');
    const [winLose, setWinLose] = useState('all');
    const [vsMatchup, setVsMatchup] = useState('0');
    const [paceAdjust, setPaceAdjust] = useState('N');
    const [seasonType, setSeasonType] = useState('Regular+Season');

    if(props.hTeamName !== 0){
        return (<div>
            <h3 className='text-white text-center m-3' style={{display: props.subMenuItem == 3 ?  "block" :  "none"}} > Stats des joueurs</h3>
            <PlayersStatArray 
                teams={props.teams} 
                hTeamName={props.hTeamName}
                        lastNgames={lastNgames} 
                        homeOrAway={homeOrAway} 
                        winLose={winLose} 
                        vsMatchup={vsMatchup} 
                        paceAdjust={paceAdjust} 
                        seasonType={seasonType}
                        registered={props.registered} user={props.user} it={props.it} setIt={props.setIt}  gameId={props.gameId} startTime={props.startTime} startDate={props.startDate}
                        subMenuItem = {props.subMenuItem}
                        />
                <div className='d-flex justify-content-center'>    
               {props.subMenuItem == 3 &&  <TeamsStatsButtonBar 
                lastNgames={lastNgames} setLastNGames={setLastNGames} 
                homeOrAway={homeOrAway} setHomeOrAway={setHomeOrAway}
                winLose={winLose} setWinLose={setWinLose} 
                vsMatchup={vsMatchup} setVsMatchup={setVsMatchup}
                paceAdjust={paceAdjust} setPaceAdjust={setPaceAdjust}
                seasonType={seasonType} setSeasonType= {setSeasonType}/>}  </div>
                </div>)
    } else {
        return <h2>Clique sur un match en haut de page pour voir les paris disponibles sur ce match </h2> }   
}
export default PlayersStats
