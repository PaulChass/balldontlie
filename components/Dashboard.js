import React from 'react';

import { useState, useEffect } from 'react';
import '../styles/AvailableBets.css';



function Dashboard(props) {     
  if(props.hTeamName!==0){

    const [simulated, setSimulated] = useState(0);
    const [bets, setBets] = useState([]);
    const [userBets, setUserBets] = useState([]);
    const [day,setDay] =useState(0);
    const [betAmount,setBetAmount] =useState(10);
    const [homeOrAway,setHomeOrAway] = useState(0);

    var showNBets = 15;
    
    var homeTeam = props.hTeamName;
    var awayTeam = props.aTeamName;
    var homeName = homeTeam.split(" ");
    var awayName = awayTeam.split(" ");
    var  game = awayTeam+'@'+homeTeam; 
    
    useEffect(() => {
    props.setIt(props.it+1);
    const exceptions = [
        "Angeles",
        "Antonio",
        "Trail",
        "State",
        "Orleans",
        "York",
        "City"
      ];
    if(exceptions.includes(homeName[1])){homeName[1]=homeName[2]}
    if(exceptions.includes(awayName[1])){awayName[1]=awayName[2]}

    const url = "https://balldontlie.fr/index.php/simulation/" + homeName[1] + "/" + awayName[1];
    const simulate = fetch(url)
        .then((response) => response.json())
        .then((data) => {
          return data;
        });

      simulate.then((d) => {
        setSimulated(d.data);
      })},[homeTeam, awayTeam])
    
   
      function timeToBet()
      {
        var clockTime = new Date().toLocaleTimeString();
        var clockTimes = clockTime.split(':');
        var el=0;
        var elementId=0;
        if(bets.length!==0){
        for (let index = 0; index < bets.length; index++) {
            var startTime = bets[index]['startTime'];
            var startTimes = startTime.split(':');
            startTimes[0] = parseInt(startTimes[0]);
            startTimes[1] = parseInt(startTimes[1]);
            if(startTimes[0]<6){
              startTimes[0]= startTimes[0]+24
            } 
            
            var h = startTimes[0]-parseInt(clockTimes[0]);
            var m = startTimes[1]-parseInt(clockTimes[1]);
           
            var s = 60 - parseInt(clockTimes[2]);
            if(s!=60){m =m-1} else {s=0};
            if(m<0){ m = 60+m; h=h-1;}
            if(h>=24){h=h-24;}
            elementId='btimeToBet'+bets[index]['id'];
            el = document.getElementById(elementId);
            if(el!==null){el.innerHTML = h + 'h' + m + 'm' + s +'s';}
           

          }}
      }
      
      setInterval(timeToBet, 1000);

      function getBalance(user)
      {
    
      let url = '/index.php/balance/'+user;
      fetch(url) // Replace with the correct API endpoint URL
        .then(response => response.json())
        .then(data => props.setBalance(data))
        .catch(error => console.error('Error fetching data:', error));
       }




   function bet(){ if(props.registered =='Registration successful' ){
    if(homeOrAway=='0'){
      var odd = 1/(simulated.hWins / simulated.count);
    } else {
      var odd = 1/(simulated.aWins / simulated.count);
    }
    props.setIt(props.it+1);    
    // Send the registration data to your Symfony backend API
    
    fetch('index.php/bet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({team:homeOrAway, odd:odd, user:props.user,game:game,gameId:props.gameId,betAmount:betAmount,startTime:props.startTime,startDate:props.startDate}),
    })
      .then((response) => {
        if (response.status === 200 ) {
          props.setIt(props.it+1);
          alert('pari enregistré');
        } else {
          // Handle registration errors, e.g., display error messages
        }
      })
      .catch((error) => {
        // Handle network or other errors
      });
    }else{alert('Vous devez être connecté pour proposer ce pari');}
  }
	
    function showBets(game){
      ///All bets but user bets for this game
      useEffect(() => {
        let url = '/index.php/fetch-bets/'+game;
        fetch(url) // Replace with the correct API endpoint URL
          .then(response => response.json())
          .then(data => setBets(data))
          .catch(error => console.error('Error fetching data:', error));
      },[props.it,props.hTeamName,props.gameId]);

      if(typeof(bets[0]) != "undefined" &&  props.registered =='Registration successful')
	    { 
        for (let index = 0; index < bets.length; index++) {
          if (bets[index].Username == props.user){
            bets.splice(index,1);
            index=index-1;
          }}
      }

      var date = new Date(); 
      for (let i = 0; i < bets.length; i++) {
        if(bets[i].startTime ==date.getFullYear+'-'+date.getMonth()+'-'+day)
        {bets.splice(i,1);
          i=i-1;}}


      if(typeof(bets[0]) != "undefined")
	    {   
        return (
        <div style={{display: props.menuItem == 1 ? 'block' : 'none' }}>
         <span>{props.user!=='' && getBalance(props.user)}</span> 
          {<h2 className='text-center text-white m-3'><span>Paris disponible pour ce match </span> : </h2>}
          <div className="gameBets">
            {typeof(bets[0]) !== 'undefined' && bets.slice(0, 10).map((bet) => (
            <div key={bet.id} className="gameBetAvailable mx-auto card bg-dark text-white mb-4 col-md-9" style={{borderRadius:"2rem"}}>
              <div className="card-body">
                <div className="gameInfo mb-4">
                <h5 className="card-title gameName">{bet.Game}</h5>
                  <p className="card-text teamName">
                    {bet.HomeorAway === 1
                      ? bet.Game.substring(bet.Game.indexOf("@") + 1)
                      : bet.Game.substring(0, bet.Game.indexOf("@"))}
                  </p>
                </div>
                <div className="betDetails mb-4">
                  <p className="card-text mise">Mise: {(bet.Amount * bet.Odd - bet.Amount).toFixed(2)} €</p>
                  <p className="card-text cote">Cote: {(1 / (1 - 1 / bet.Odd)).toFixed(2)}</p>
                </div>
                <div className="betDetails mb-4">
                  <p className="card-text gains">Gains: {(((1 / (1 - 1 / bet.Odd)).toFixed(2))*(bet.Amount * bet.Odd - bet.Amount)).toFixed(2)}€</p>
                  <p className="card-text timeRemaining">Temps restant: <span id={'btimeToBet' + bet.id}></span></p>
                </div>
                <button className="btn btn-primary btn-lg btn-block" onClick={() => acceptBet(bet.id, bet.startTime, bet.startDate)}>Parier</button>
              </div>
            </div>
            ))}
          </div>          
        </div>
                )
      }
    //  else {return(<div> Aucun pari dispo pour ce match</div>)}
    }

  

    function acceptBet(id, startTime,startDate){
      if(props.registered =='Registration successful' ){
         // Send the registration data to your Symfony backend API
       fetch('index.php/acceptBet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user:props.user,id:id,startTime:startTime,startDate:startDate}),
    })
      .then((response) => {
        if (response.status === 200) {
         props.setIt(props.it+1);
         alert('pari accepté');
        } else {
        }
      })
      .catch((error) => {
        // Handle network or other errors
      });
    }else{alert('non connecté')}}

   

    function getBets(user)
    {
      if(props.registered =='Registration successful' ){
      useEffect(() => {
        let url = '/index.php/bets/'+user;
        fetch(url) // Replace with the correct API endpoint URL
          .then(response => response.json())
          .then(data => setUserBets(data))
          .catch(error => console.error('Error fetching data:', error));
      },[props]);
      if(typeof(userBets[0]) != "undefined")
	    { 
        return (<div id="myBets"  style={{display: props.menuItem == 2 ? 'block' : 'none' }}>
        <table className="col-md-10 mx-auto table table-hover table-dark"> <tbody>
         { typeof(userBets[0])!=='undefined' && userBets.slice(-showNBets).reverse().map((bet) => <tr key={bet.id}>
          <td>{bet.Game}</td>
          <td>{bet.HomeorAway== 0 ? 
          bet.Game.substring(bet.Game.indexOf("@")+1) :
            bet.Game.substring(0, bet.Game.indexOf("@"))}</td>
             <td> mise: {bet.Amount} € </td><td> cote : {bet.Odd.toFixed(2)}</td>
          <td>Statut: {bet.Status}</td>
          </tr>
          )}
          </tbody></table></div>
        )
      }
    }}

    useEffect(() => {
      props.setIt(props.it+1);
      homeTeam = props.hTeamName;
      awayTeam = props.aTeamName;
      homeName = homeTeam.split(" ");
      awayName = awayTeam.split(" ");
      game = awayTeam+'@'+homeTeam; 
    },[props.gameId,homeTeam]  
      )

  
      
    
    
  
    return (
    <div>
      <div className='mx-auto' style={{display: props.menuItem == 1 ? 'block' : 'none' }}>
     
      <h2 className='text-center text-white m-3'>{props.aTeamName}@{props.hTeamName}</h2>
      <h3 className='text-center text-white m-3'>Propose un pari pour ce match</h3>
      <p className='text-center text-white'> (remboursé si aucun preneur)</p>

      <table className="col-md-10  table table-hover table-dark bg-dark text-white large" style={{borderRadius:"4rem",opacity:0.8,margin:"auto"}}><tbody><tr>
      <td style={{padding:"2rem"}}>Miser <input
          type="number"
          min="0"
          max="20"
          className='form-control'
          onChange={(e) => setBetAmount(e.target.value)}
          value={betAmount}
          /> </td>
          <td> sur les
          <select className='custom-select' name="homeOrAway" id="homeOrAwaySelect"  onChange={(e) => (setHomeOrAway(e.target.value))}>
              <option value='0'>{homeTeam}</option>
              <option value='1'>{awayTeam} </option>
          </select></td>
      <td>Cote :<p className='large'>{homeOrAway==0 && simulated !== 0 &&
                      (1 / (simulated.hWins / simulated.count)).toFixed(2)}
                      {homeOrAway==1 && simulated !== 0 &&
                      (1 / (simulated.aWins / simulated.count)).toFixed(2)}
                      </p></td>
            <td>Gains :<p className='large'>{homeOrAway==0 && simulated !== 0 &&
                      ((1 / (simulated.hWins / simulated.count))*betAmount).toFixed(2)}
                      {homeOrAway==1 && simulated !== 0 &&
                      ((1 / (simulated.aWins / simulated.count))*betAmount).toFixed(2)}
                      </p></td>
                      <td><button className="btn btn-primary w-50 " onClick={() => bet({homeOrAway})}>Miser </button></td>         
      </tr></tbody>
      </table>    
      </div>
      {showBets(game)}
      <div id='clock'></div>
    </div>
    )
  }else{
    if(props.menuItem==1){
          return <h2>Clique sur un match en haut de page pour voir les paris disponibles sur ce match </h2> } 
 } return null
}

export default Dashboard;