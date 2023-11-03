import React from 'react';
import PlayersStatArray from './PlayersStatArray';
import TeamsStatsButtonBar from './TeamsStatsButtonBar';
import { useState } from 'react';


function PlayersStats(teams) {

    const [lastNgames, setLastNGames] = useState('0');
    const [homeOrAway, setHomeOrAway] = useState('all');
    const [winLose, setWinLose] = useState('all');
    const [vsMatchup, setVsMatchup] = useState('0');
    const [paceAdjust, setPaceAdjust] = useState('N');
    const [seasonType, setSeasonType] = useState('Regular+Season');


    return (<div>
        <h1 className='text-white fs-2 text-center p-3 m-3'> Stats des joueurs</h1>
        <PlayersStatArray 
              teams={teams} 
                       lastNgames={lastNgames} 
                       homeOrAway={homeOrAway} 
                       winLose={winLose} 
                       vsMatchup={vsMatchup} 
                       paceAdjust={paceAdjust} 
                       seasonType={seasonType}/>
            <div className='d-flex justify-content-center'>    
            <TeamsStatsButtonBar 
            lastNgames={lastNgames} setLastNGames={setLastNGames} 
            homeOrAway={homeOrAway} setHomeOrAway={setHomeOrAway}
            winLose={winLose} setWinLose={setWinLose} 
            vsMatchup={vsMatchup} setVsMatchup={setVsMatchup}
            paceAdjust={paceAdjust} setPaceAdjust={setPaceAdjust}
            seasonType={seasonType} setSeasonType= {setSeasonType}/>  </div>
            </div>)
}

export default PlayersStats
