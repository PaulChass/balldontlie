import React from 'react';
import { createRoot } from 'react-dom/client';

import { useState, useEffect } from 'react';
import Banner from './components/Banner'
import TeamsStats from './components/TeamsStats'
import PlayersStats from './components/PlayersStats'
import Twitter from './components/Twitter'
import Navbar from './components/Navbar'
import SignInForm from './components/SignInForm'
import RegistrationForm from './components/RegistrationForm'
import Landing from './components/Landing'
import Comments from './components/Comments'
import Footer from './components/Footer'


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
  const [changeGameId, setChangeGameId] = useState(0);
  const [showSignIn, setShowSignIn] = useState(false);

  // Restaure la session au chargement (le cookie HttpOnly est posé côté serveur au login).
  // L'identité ne vit plus seulement dans l'état React : évite la déconnexion au rafraîchissement.
  useEffect(() => {
    fetch('/index.php/me')
      .then(response => response.json())
      .then(data => {
        if (data && data.authenticated) {
          setUser(data.name);
          setRegistered('Registration successful');
        }
      })
      .catch(error => console.error('Error restoring session:', error));
  }, []);

  // Déconnexion : détruit la session serveur puis vide l'état local.
  function logout() {
    fetch('/index.php/logout', { method: 'POST' })
      .catch(error => console.error('Error logging out:', error))
      .finally(() => {
        setUser('');
        setRegistered('');
        setMenuItem(0);
      });
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
  if (data.data !== undefined && gameNumber !== -1 && data.data[gameNumber] !== undefined) {
    teams = [data.data[gameNumber]['HomeTeamId'], data.data[gameNumber]['AwayTeamId']];
  }
  useEffect(() => {
    if (teams[0] !== 0) {
      setHTeamName(teamsArray[teams[0] - 1610612737]);
      setATeamName(teamsArray[teams[1] - 1610612737]);
    }
  }, [teams])

  return (
    <div key='banner'>

      <Banner games={data} gameNumber={gameNumber} setGameNumber={setGameNumber} setGameId={setGameId} setStartTime={setStartTime} setStartDate={setStartDate} setHTeamName={setHTeamName} setATeamName={setATeamName} setMenuItem={setMenuItem} menuItem={menuItem} gameId={gameId} changeGameId={changeGameId} setChangeGameId={setChangeGameId} />

      <div style={{ minHeight: '75vh', marginBottom: '5rem' }}>
        <Navbar registered={registered} setRegistered={setRegistered} user={user} setUser={setUser} menuItem={menuItem} setMenuItem={setMenuItem} setShowSignIn={setShowSignIn} showSignIn={showSignIn} logout={logout} />

        <SignInForm registered={registered} setRegistered={setRegistered} user={user} setUser={setUser} menuItem={menuItem} setMenuItem={setMenuItem} setShowSignIn={setShowSignIn} showSignIn={showSignIn} />
        <RegistrationForm registered={registered} setRegistered={setRegistered} user={user} setUser={setUser} menuItem={menuItem} setMenuItem={setMenuItem} />

        <div style={{ display: showSignIn ? 'none' : 'block' }}>
          {menuItem == 0 && (<Landing setMenuItem={setMenuItem} />)}
          {menuItem == 3 && (
            <div>
              <TeamsStats teams={teams} hTeamName={hTeamName} setHTeamName={setHTeamName} registered={registered} user={user} aTeamName={aTeamName} setATeamName={setATeamName} gameId={gameId} startTime={startTime} startDate={startDate} it={it} setIt={setIt} />
              <Comments gameId={gameId} user={user} registered={registered} />
              <Twitter teams={teams} /></div>)}
          {menuItem == 4 && (<div>
            <PlayersStats teams={teams} hTeamName={hTeamName} aTeamName={aTeamName} registered={registered} user={user} it={it} setIt={setIt} gameId={gameId} startTime={startTime} startDate={startDate} /></div>)}
        </div>
      </div>
    <Footer />
    </div>
  )
}
const root = createRoot(document.getElementById("reactApp"));
root.render(<ReactApp />);
export default ReactApp
