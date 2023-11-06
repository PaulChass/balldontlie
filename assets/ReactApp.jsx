import React from 'react';
import ReactDOM from 'react-dom';
import { useState } from 'react';
import Banner from './components/Banner'
import TeamsStats from './components/TeamsStats'
import PlayersStats from './components/PlayersStats'
import Twitter from './components/Twitter'
import Registration from './components/Registration'
import SignIn from './components/SignIn'


function ReactApp(data) {

  const [gameNumber, setGameNumber] = useState(0);
  const [gameId, setGameId] = useState(0);
  const [registered, setRegistered] = useState('');
  const [user, setUser] = useState('');


  

  var teams=[0,0];
  if(data.data !== undefined && gameNumber !== -1){
    teams= [data.data[gameNumber]['HomeTeamId'],data.data[gameNumber]['AwayTeamId']]
  };
  
  return (<div key='banner'>
  <Banner games={data} gameNumber={gameNumber} setGameNumber={setGameNumber} setGameId={setGameId}/>
  <div style={{display: gameNumber !== -1 ? 'block' : 'none' }}>
  <Registration teams={teams} gameNumber={gameNumber} gameId={gameId} registered={registered} setRegistered={setRegistered} user={user} setUser={setUser}/>
   <SignIn teams={teams} gameNumber={gameNumber} gameId={gameId} registered={registered} setRegistered={setRegistered} user={user} setUser={setUser}/>
   <TeamsStats teams={teams} />
   
   

   <PlayersStats teams={teams}/>
   <Twitter teams={teams}/>
   </div>
   
   <div style={{display: gameNumber === -1 ? 'block' : 'none' }} className="row">
    <div className="col-lg-8 col-10 col-sm-12 order-fisrt mx-auto">
        <h3 className="whitetitle" id="home"> Bienvenue sur le site des parieurs NBA !</h3>
        <h5 className="whitetitle"> Retrouve toutes les stats, cotes, infos et conseil pour faire tes pronostics sur les matchs NBA à venir. <br/> Clique simplement sur un des matchs de la nuit en haut de page pour comparer les équipes qui vont s'affronter </h5>
 
        <div className="row justify-content-center">

        <img className="col-12 col-lg-6" style={{ width:"100%",height:"auto"}} src="https://i.pinimg.com/originals/a1/a1/05/a1a105663e060c720d4853ef7feee892.jpg"/>   
      </div>
    </div>
  </div>
   

  </div>
  )
}

ReactDOM.render(<ReactApp/> , document.getElementById("reactApp"))

export default ReactApp

