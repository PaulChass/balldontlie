import React from 'react';
import { useState, useEffect } from 'react';
import StatGraph from './StatGraph';
import '../styles/PlayersStatsArray.css'
import BetStatForm from './BetStatForm';



function PlayersStats(props) {
  const [hPlayersStats, setHPlayersStats] = useState(0);
  const [aPlayersStats, setAPlayersStats] = useState(0);
  const [graphParam, setGraphParam] = useState([0, 0]);
  const [formParam, setFormParam] = useState([0, 0, 0]);


  useEffect(() => {
    if (typeof (props.teams) !== 'undefined' && props.teams[0] !== 0) {
      var homeUrl = 'https://balldontlie.fr/index.php/playersStats/' + props.teams[0] +
        '/' + props.lastNgames + '/' + props.homeOrAway + '/' + props.winLose + '/' + props.vsMatchup + '/' + props.paceAdjust + '/' + props.seasonType;
      var awayUrl = 'https://balldontlie.fr/index.php/playersStats/' + props.teams[1] +
        '/' + props.lastNgames + '/' + props.homeOrAway + '/' + props.winLose + '/' + props.vsMatchup + '/' + props.paceAdjust + '/' + props.seasonType;

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
          setHPlayersStats(h.data)

        });
        ateamStats.then((a) => {
          setAPlayersStats(a.data)
        })
      }
      setGraphParam([0,0]);
      getTeamsStats();
    }
  }, [props.teams,props.lastNgames,props.homeOrAway ,props.winLose,props.vsMatchup,props.paceAdjust,props.seasonType])

  function getGraph(id, name, stat,statValue) {
    document.getElementById('graph').scrollIntoView();
    setGraphParam([id, stat]);
    setFormParam([id, name, stat,statValue])
  }

  function showStats(PlayersStats) {
    let logoUrl = "https://cdn.nba.com/logos/nba/"+ PlayersStats[0].teamId +"/global/L/logo.svg";
    return <table id="tb1" className="col-md-10 mx-auto table table-hover table-dark ">
      <thead>
        <tr>
          <th scope="col"><img style={{ maxHeight: "80px" }} src={logoUrl} /></th>
          <th scope="col">   </th>
          <th scope="col"> Matchs</th>
          <th scope="col"> Minutes</th>
          <th scope="col"> Points</th>
          <th scope="col">Rebonds</th>
          <th scope="col"  > Passes </th>
          <th scope="col"  > Contres </th>
          <th scope="col"  > Inters</th>
          <th scope="col"  > %3 Pts </th>
          <th scope="col"  > %Tir </th>
          <th scope="col"  > +/- </th>

        </tr></thead>
      <tbody>{PlayersStats[0] !== undefined ?
        PlayersStats.slice(0, 10).map((player) => <tr key={player.id}>
          <td><img style={{ maxHeight: "50px" }} src={"https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/1040x760/" + player.id + ".png"} ></img></td>
          <td className='align-middle text-center'> {player.name}</td>
          <td className='align-middle text-center'>{player.games} </td>
          <td className='align-middle text-center'>

            <button className="btn btn-black statButton" onClick={() => getGraph(player.id, player.name, 'minutes',player.minutes)}>
              {player.minutes}
            </button></td>
          <td className='align-middle text-center'>
            <button className="btn btn-black statButton" onClick={() => getGraph(player.id, player.name, 'points',player.points)}>
              {player.points}</button></td>
          <td className='align-middle text-center'>
            <button className="btn btn-black statButton" onClick={() => getGraph(player.id, player.name, 'rebonds',player.rebounds)}>
              {player.rebounds} </button>
          </td>
          <td className='align-middle text-center'>
            <button className="btn btn-black statButton" onClick={() => getGraph(player.id, player.name, 'passes',player.assists)}>{player.assists}</button></td>
          <td className='align-middle text-center'>
            <button className="btn btn-black statButton" onClick={() => getGraph(player.id, player.name, 'contres',player.blocks)}>{player.blocks}</button></td>
          <td className='align-middle text-center'>
            <button className="btn btn-black statButton" onClick={() => getGraph(player.id, player.name, 'interceptions',player.steals)}>{player.steals}</button></td>
          <td className='align-middle text-center'>
            <button className="btn btn-black statButton" onClick={() => getGraph(player.id, player.name, '3pt_pct',player.three_fg_pct)}>{player.three_fg_pct}</button></td>
          <td className='align-middle text-center'>
            <button className="btn btn-black statButton" onClick={() => getGraph(player.id, player.name,'fg_pct',player.fg_pct)}>{player.fg_pct}</button></td>
          <td className='align-middle text-center'>
            <button className="btn btn-black statButton" onClick={() => getGraph(player.id ,player.name, '+/-',player.plusminus)}>{player.plusminus}</button></td>
        </tr>
        ) : null}</tbody></table>;
  }
  return (<div className="playersStats col-lg-10" style={{margin:"auto"}}>
            <div id='graph' className='pt-3 pb-3' > {graphParam[0] !== 0 ?
              (<div><StatGraph graphParam={graphParam} setGraphParam={setGraphParam} />
                    <BetStatForm id={formParam[0]} name={formParam[1]} stat={formParam[2]} statValue={formParam[3]} registered={props.registered} user={props.user} it={props.it} setIt={props.setIt}  gameId={props.gameId} startTime={props.startTime} startDate={props.startDate}/>
              </div>)
              :
              <p className="alert-info p-3 m-3" style={{ borderRadius: '5px',textAlign:"center" }}>Clique sur une stat pour voir son évolution et miser dessus !</p>}
            </div>

            {hPlayersStats[0] !== undefined && 
            showStats(hPlayersStats)}
            <br /> {aPlayersStats[0] !== undefined && 
            showStats(aPlayersStats)}
  </div>)


}

export default PlayersStats
