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
            <h2 className='text-center text-white m-3' style={{opacity:0.8}}>{props.aTeamName}@{props.hTeamName}</h2>
            <h3 className='text-white text-center m-3' style={{opacity:0.8}}> Miser sur les stats d'un joueur</h3>
            <p className='text-center text-white'> (remboursé si aucun preneur)</p>
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
                        
                        />
                <div className='d-flex justify-content-center'>    
                <TeamsStatsButtonBar 
                lastNgames={lastNgames} setLastNGames={setLastNGames} 
                homeOrAway={homeOrAway} setHomeOrAway={setHomeOrAway}
                winLose={winLose} setWinLose={setWinLose} 
                vsMatchup={vsMatchup} setVsMatchup={setVsMatchup}
                paceAdjust={paceAdjust} setPaceAdjust={setPaceAdjust}
                seasonType={seasonType} setSeasonType= {setSeasonType}/>  </div>
                </div>)
    } else {
        return <h2>Clique sur un match en haut de page pour voir les paris disponibles sur ce match </h2> }   
}
export default PlayersStats
