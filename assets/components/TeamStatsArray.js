import React from 'react';
import { useState, useEffect } from 'react';
import '../styles/TeamsStatsArray.css'
import TeamsStatsButtonBar from './TeamsStatsButtonBar'
import Injuries from './Injuries'
import Simulation from './Simulation'




function TeamsStatsArrays({teams}) {

  const [lastNgames, setLastNGames] = useState('0');
  const [homeOrAway, setHomeOrAway] = useState('all');
  const [winLose, setWinLose] = useState('all');
  const [vsMatchup, setVsMatchup] = useState('0');
  const [paceAdjust, setPaceAdjust] = useState('N');
  const [seasonType, setSeasonType] = useState('Regular+Season');
  const [hTeamName, setHTeamName] = useState(0);
  const [aTeamName, setATeamName] = useState(0);


  var homeLogo = document.getElementById('homeLogo');
  var hteam = document.getElementById('hTeam');
  var hTeamPoints = document.getElementById('hTeamPoints');
  var hWon = document.getElementById('hWon');
  var hLost = document.getElementById('hLost');
  var hReb = document.getElementById('hReb');
  var hBlk = document.getElementById('hBlk');
  var hAss = document.getElementById('hAss');
  var hStl = document.getElementById('hStl');
  var hTo = document.getElementById('hTo');
  var h3pct = document.getElementById('h3pct');
  var h2pct = document.getElementById('h2pct');
  var h3ptAtt = document.getElementById('h3ptAtt');





  var awayLogo = document.getElementById('awayLogo');
  var ateam = document.getElementById('aTeam');
  var aTeamPoints = document.getElementById('aTeamPoints');
  var aWon = document.getElementById('aWon');
  var aLost = document.getElementById('aLost');
  var aReb = document.getElementById('aReb');
  var aBlk = document.getElementById('aBlk');
  var aAss = document.getElementById('aAss');
  var aStl = document.getElementById('aStl');
  var hTo = document.getElementById('hTo');
  var a3pct = document.getElementById('a3pct');
  var a2pct = document.getElementById('a2pct');
  var a3ptAtt = document.getElementById('a3ptAtt');



  useEffect(() => {
    if (typeof (teams) !== 'undefined' && teams.teams[0] !== 0) {
      var homeUrl = 'http://192.168.1.20:8000/index.php/stats/' + teams.teams[0] +
        '/' + lastNgames + '/' + homeOrAway + '/' + winLose + '/' + vsMatchup + '/' + paceAdjust + '/' + seasonType;
      var awayUrl = 'http://192.168.1.20:8000/index.php/stats/' + teams.teams[1] +
        '/' + lastNgames + '/' + homeOrAway + '/' + winLose + '/' + vsMatchup + '/' + paceAdjust + '/' + seasonType;

      const hteamStats = fetch(homeUrl) //1
        .then((response) => response.json()) //2
        .then((team) => {
          return team //3
        });

      const ateamStats = fetch(awayUrl) //1
        .then((response) => response.json()) //2
        .then((team) => {
          return team //3
        });


      const getTeamsStats = () => {
        hteamStats.then((h) => {
          hTeamPoints.innerHTML = h.data.points;
          hteam.innerHTML = h.data.Team;
          setHTeamName(h.data.Team);
          homeLogo.innerHTML = "<img class='logo' src='https://cdn.nba.com/logos/nba/" + h.data.team_id+"/global/L/logo.svg'/> ";
          hWon.innerHTML = h.data.wins + ' ';
          hLost.innerHTML = ' ' + h.data.losses;
          hReb.innerHTML = h.data.rebounds;
          hBlk.innerHTML = h.data.blocks;
          hAss.innerHTML = h.data.assists;
          hStl.innerHTML = h.data.steals;
          hTo.innerHTML = h.data.turnovers;
          h3pct.innerHTML = h.data.three_fg_pct;
          h2pct.innerHTML = h.data.fg_pct;
          h3ptAtt.innerHTML = h.data.three_attempts;


        });

        ateamStats.then((a) => {
          aTeamPoints.innerHTML = a.data.points;
          ateam.innerHTML = a.data.Team;
          setATeamName(a.data.Team);
          awayLogo.innerHTML = "<img class='logo' src='https://cdn.nba.com/logos/nba/" + a.data.team_id+"/global/L/logo.svg'/> ";
          aWon.innerHTML = a.data.wins + ' ';
          aLost.innerHTML = ' ' + a.data.losses;
          aReb.innerHTML = a.data.rebounds;
          aBlk.innerHTML = a.data.blocks;
          aAss.innerHTML = a.data.assists;
          aStl.innerHTML = a.data.steals;
          aTo.innerHTML = a.data.turnovers;
          a3pct.innerHTML = a.data.three_fg_pct;
          a2pct.innerHTML = a.data.fg_pct;
          a3ptAtt.innerHTML = a.data.three_attempts;


        });
      };

      getTeamsStats();

    } 

  },[teams.teams,lastNgames,homeOrAway,winLose,paceAdjust,vsMatchup,seasonType])




  return (
    <div>
    <div id="" className="teamStats d-flex center text-center">
    <table id="" className="table table-hover table-dark" >
      <caption style={{ captionSide: 'top', color: 'white', textAlign: 'center' }}><h1><span id="aTeam"></span>@<span id="hTeam"></span></h1></caption>
      <thead>
        <tr>
          <th scope="col" className="left">Stats des équipes </th>
          <th id='homeLogo' scope="col"></th>
          <th id='awayLogo' scope="col"></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row" className="left">Bilan</th>
          <td><span id='hWon' className="text-success"></span>/
            <span id='hLost' className="text-danger"></span>
          </td>
          <td>
            <span id='aWon' className="text-success"></span>/
            <span id='aLost' className="text-danger"></span>
          </td>
        </tr>
        <tr>
          <th scope="row" className="left">Points</th>
          <td style={{ color: "white" }} id='hTeamPoints'></td>
          <td style={{ color: "white" }} id='aTeamPoints'></td>
        </tr>
        <tr>
          <th scope="row" className="left">Rebonds</th>
          <td style={{ color: "white" }} id='hReb'></td>
          <td style={{ color: "white" }} id='aReb'></td>
        </tr>
        <tr>
          <th scope="row" className="left">Passes</th>
          <td style={{ color: "white" }} id='hAss'></td>
          <td style={{ color: "white" }} id='aAss'></td>
        </tr>
        <tr>
          <th scope="row" className="left">Contres</th>
          <td style={{ color: "white" }} id='hBlk'></td>
          <td style={{ color: "white" }} id='aBlk'></td>
        </tr>
        
        <tr>
          <th scope="row" className="left">Interceptions</th>
          <td style={{ color: "white" }} id='hStl'></td>
          <td style={{ color: "white" }} id='aStl'></td>
        </tr>
        <tr>
          <th scope="row" className="left">Pertes de balle</th>
          <td style={{ color: "white" }} id='hTo'></td>
          <td style={{ color: "white" }} id='aTo'></td>
        </tr>
        <tr>
          <th scope="row" className="left"> 3pts tentés</th>
          <td style={{ color: "white" }} id='h3ptAtt'></td>
          <td style={{ color: "white" }} id='a3ptAtt'></td>
        </tr>
        <tr>
          <th scope="row" className="left">% 3pts</th>
          <td style={{ color: "white" }} id='h3pct'></td>
          <td style={{ color: "white" }} id='a3pct'></td>
        </tr>
        <tr>
          <th scope="row" className="left">% Total</th>
          <td style={{ color: "white" }} id='h2pct'></td>
          <td style={{ color: "white" }} id='a2pct'></td>
        </tr>
      </tbody>
    </table> </div>
    
    <div className='d-flex justify-content-center'>    
    <TeamsStatsButtonBar 
     lastNgames={lastNgames} setLastNGames={setLastNGames} 
     homeOrAway={homeOrAway} setHomeOrAway={setHomeOrAway}
     winLose={winLose} setWinLose={setWinLose} 
     vsMatchup={vsMatchup} setVsMatchup={setVsMatchup}
     paceAdjust={paceAdjust} setPaceAdjust={setPaceAdjust}
     seasonType={seasonType} setSeasonType={setSeasonType}
     />  
    </div>
    {aTeamName !== 0 && <Simulation hTeamName={hTeamName} aTeamName={aTeamName} />}
    {aTeamName !== 0 && <Injuries teams={teams} hTeamName={hTeamName} aTeamName={aTeamName} />}

  </div>
  )
}


export default TeamsStatsArrays
