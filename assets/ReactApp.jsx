import React from 'react';
import { createRoot } from 'react-dom/client';

import { useState, useEffect } from 'react';
import Banner from './components/Banner'
import TeamsStats from './components/TeamsStats'
import PlayersStats from './components/PlayersStats'
import Twitter from './components/Twitter'
import Navbar from './components/Navbar'
import MyBets from './components/MyBets.js'
import Dashboard from './components/Dashboard'
import SignInForm from './components/SignInForm'
import RegistrationForm from './components/RegistrationForm'
import AvailableBets from './components/AvailableBets'
import Comments from './components/Comments'




function ReactApp(data) {

  const [gameNumber, setGameNumber] = useState(0);
  const [gameId, setGameId] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [startDate, setStartDate] = useState(0);
  const [registered, setRegistered] = useState('');
  const [user, setUser] = useState('');
  const [hTeamName, setHTeamName] = useState(0);
  const [aTeamName, setATeamName] = useState(0);
  const [menuItem, setMenuItem] = useState(0);
  const [it, setIt] = useState(0);
  const [balance, setBalance] = useState('');
  const [changeGameId, setChangeGameId] = useState(0);
  const [showSignIn,setShowSignIn] = useState(false);


  function getBalance(user) {
    let url = '/index.php/balance/' + user;
    fetch(url) // Replace with the correct API endpoint URL
      .then(response => response.json())
      .then(data => setBalance(data))
      .catch(error => console.error('Error fetching data:', error));
  }



  var teams = [0, 0];
  var teamsArray = [
    "Atlanta Hawks",
    "Boston Celtics",
    "Cleveland Cavaliers",
    "New Orleans Pelicans",
    "Chicago Bulls",
    "Dallas Mavericks",
    "Denver Nuggets",
    "Golden State Warriors",
    "Houston Rockets",
    "LA Clippers",
    "Los Angeles Lakers",
    "Miami Heat",
    "Milwaukee Bucks",
    "Minnesota Timberwolves",
    "Brooklyn Nets",
    "New York Knicks",
    "Orlando Magic",
    "Indiana Pacers",
    "Philadelphia 76ers",
    "Phoenix Suns",
    "Portland Trail Blazers",
    "Sacramento Kings",
    "San Antonio Spurs",
    "Oklahoma City Thunder",
    "Toronto Raptors",
    "Utah Jazz",
    "Memphis Grizzlies",
    "Washington Wizards",
    "Detroit Pistons",
    "Charlotte Hornets"
  ];
  if (data.data !== undefined && gameNumber !== -1) {
    teams = [data.data[gameNumber]['HomeTeamId'], data.data[gameNumber]['AwayTeamId']];
  }
  useEffect(() => {
    if (teams[0] !== 0) {
      setHTeamName(teamsArray[teams[0] - 1610612737]);
      setATeamName(teamsArray[teams[1] - 1610612737]);
    }
  }, [teams])
  return (<div key='banner'>

    <Banner games={data} gameNumber={gameNumber} setGameNumber={setGameNumber} setGameId={setGameId} setStartTime={setStartTime} setStartDate={setStartDate} setHTeamName={setHTeamName} setATeamName={setATeamName} setMenuItem={setMenuItem} menuItem={menuItem} gameId={gameId} changeGameId={changeGameId} setChangeGameId={setChangeGameId}/>
    <span>{user !== '' && getBalance(user)}</span>

    <div style={{ display: gameNumber !== -1 ? 'block' : 'none' }}>
      <Navbar teams={teams} gameNumber={gameNumber} gameId={gameId} registered={registered} setRegistered={setRegistered} user={user} setUser={setUser} hTeamName={hTeamName} aTeamName={aTeamName} menuItem={menuItem} setMenuItem={setMenuItem} it={it} balance={balance} setBalance={setBalance} setShowSignIn={setShowSignIn} showSignIn={showSignIn} />

      <SignInForm registered={registered} setRegistered={setRegistered} user={user} setUser={setUser} menuItem={menuItem} setMenuItem={setMenuItem} setShowSignIn={setShowSignIn} showSignIn={showSignIn}/>
    <div style={{display: showSignIn?'none':'block'}}>
        <RegistrationForm registered={registered} setRegistered={setRegistered} user={user} setUser={setUser} menuItem={menuItem} setMenuItem={setMenuItem} />
        {menuItem == 0 && (<AvailableBets registered={registered} user={user} setBalance={setBalance} data={data.data} setMenuItem={setMenuItem} gameId={gameId} setChangeGameId={setChangeGameId} />)}
        {menuItem == 2 && (<MyBets registered={registered} user={user} menuItem={menuItem} setMenuItem={setMenuItem} />)}
        {menuItem == 3 && (
          <div>
            <TeamsStats teams={teams} hTeamName={hTeamName} setHTeamName={setHTeamName} registered={registered} user={user} aTeamName={aTeamName} setATeamName={setATeamName} gameId={gameId} startTime={startTime} startDate={startDate} it={it} setIt={setIt} setBalance={setBalance} />
            <Comments gameId={gameId}  user={user} registered={registered}/>
            <Twitter teams={teams} /></div>)}
            {menuItem == 4 && (<div>
            <PlayersStats teams={teams} hTeamName={hTeamName} aTeamName={aTeamName} registered={registered} user={user} it={it} setIt={setIt} gameId={gameId} startTime={startTime} startDate={startDate} /></div>)}
            <Dashboard teams={teams} gameNumber={gameNumber} gameId={gameId} startTime={startTime} registered={registered} setRegistered={setRegistered} user={user} setUser={setUser} hTeamName={hTeamName} setHTeamName={setHTeamName} aTeamName={aTeamName} setATeamName={setATeamName} menuItem={menuItem} it={it} setIt={setIt} balance={balance} setBalance={setBalance} startDate={startDate} />
          </div>

      <div style={{ display: gameNumber === -1 ? 'block' : 'none' }} className="row">
        <div className="col-lg-8 col-10 col-sm-12 order-fisrt mx-auto">
          <h3 className="whitetitle" id="home"> Bienvenue sur le site des parieurs NBA !</h3>
          <h5 className="whitetitle"> Retrouve toutes les stats, cotes, infos et conseil pour faire tes pronostics sur les matchs NBA à venir. <br /> Clique simplement sur un des matchs de la nuit en haut de page pour comparer les équipes qui vont s'affronter </h5>

          <div className="row justify-content-center">

            <img className="col-12 col-lg-6" style={{ width: "100%", height: "auto" }} src="https://i.pinimg.com/originals/a1/a1/05/a1a105663e060c720d4853ef7feee892.jpg" />
          </div>
        </div>
      </div>

    </div>
  </div>
  )
}
const root = createRoot(document.getElementById("reactApp"));
root.render(<ReactApp />);
export default ReactApp

