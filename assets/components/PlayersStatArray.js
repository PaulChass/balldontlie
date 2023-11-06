import React from 'react';
import { useState, useEffect } from 'react';
import StatGraph from './StatGraph';
import '../styles/PlayersStatsArray.css'


function PlayersStats(props) {
  const [hPlayersStats, setHPlayersStats] = useState(0);
  const [aPlayersStats, setAPlayersStats] = useState(0);
  const [graphParam, setGraphParam] = useState([0, 0]);

  useEffect(() => {
    if (typeof (props.teams) !== 'undefined' && props.teams.teams[0] !== 0) {
      var homeUrl = 'http://192.168.1.20:8000/index.php/playersStats/' + props.teams.teams[0] +
        '/' + props.lastNgames + '/' + props.homeOrAway + '/' + props.winLose + '/' + props.vsMatchup + '/' + props.paceAdjust + '/' + props.seasonType;;
      var awayUrl = 'http://192.168.1.20:8000/index.php/playersStats/' + props.teams.teams[1] +
        '/' + props.lastNgames + '/' + props.homeOrAway + '/' + props.winLose + '/' + props.vsMatchup + '/' + props.paceAdjust + '/' + props.seasonType;;

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

      getTeamsStats();
    }
  }, [props])

  function getGraph(name, stat) {
    document.getElementById('graph').scrollIntoView();
    setGraphParam([name, stat]);
  }

  function showStats(PlayersStats) {
    let logoUrl = "https://cdn.nba.com/logos/nba/"+ PlayersStats[0].teamId +"/global/L/logo.svg";
    return <table id="tb1" className="w-75 mx-auto table table-hover table-dark ">
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

            <button className="btn btn-black statButton" onClick={() => getGraph(player.id, 'minutes')}>
              {player.minutes}
            </button></td>
          <td className='align-middle text-center'>
            <button className="btn btn-black statButton" onClick={() => getGraph(player.id, 'points')}>
              {player.points}</button></td>
          <td className='align-middle text-center'>
            <button className="btn btn-black statButton" onClick={() => getGraph(player.id, 'rebounds')}>
              {player.rebounds} </button>
          </td>
          <td className='align-middle text-center'>
            <button className="btn btn-black statButton" onClick={() => getGraph(player.id, 'assists')}>{player.assists}</button></td>
          <td className='align-middle text-center'>
            <button className="btn btn-black statButton" onClick={() => getGraph(player.id, 'blocks')}>{player.blocks}</button></td>
          <td className='align-middle text-center'>
            <button className="btn btn-black statButton" onClick={() => getGraph(player.id, 'steals')}>{player.steals}</button></td>
          <td className='align-middle text-center'>
            <button className="btn btn-black statButton" onClick={() => getGraph(player.id, '3pt_pct')}>{player.three_fg_pct}</button></td>
          <td className='align-middle text-center'>
            <button className="btn btn-black statButton" onClick={() => getGraph(player.id, 'fg_pct')}>{player.fg_pct}</button></td>
          <td className='align-middle text-center'>
            <button className="btn btn-black statButton" onClick={() => getGraph(player.id, 'plusMinus')}>{player.plusminus}</button></td>
        </tr>
        ) : null}</tbody></table>;
  }
  return (<div className="playersStats " >
    {hPlayersStats[0] !== undefined && showStats(hPlayersStats)}<br />
    <div id='graph' className='pt-3 pb-3' >{graphParam[0] !== 0 ?
      <StatGraph props={graphParam} />
      :
      <p className="alert-info p-3 m-3 mx-auto" style={{ width: '80%',borderRadius: '5px' }}>Clique sur une stat pour voir son évolution !</p>
    }
    </div>
    {aPlayersStats[0] !== undefined && showStats(aPlayersStats)}

  </div>)


}

export default PlayersStats
