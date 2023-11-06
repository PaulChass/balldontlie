import React from 'react';
import { useState, useEffect } from 'react';


function Dashboard(props) {
    const [simulated, setSimulated] = useState(0);
    const [bets, setBets] = useState([]);
    const [userBets, setUserBets] = useState([]);
    const [balance, setBalance] = useState('');
    const [it,setIt] =useState(0);
    const [betAmount,setBetAmount] =useState(10);
    const [homeOrAway,setHomeOrAway] = useState(0);


    
    var homeTeam = document.getElementById('hTeam').innerHTML;
    var awayTeam = document.getElementById('aTeam').innerHTML;

    const homeName = homeTeam.split(" ");
    const awayName = awayTeam.split(" ");
    var game = awayTeam+'@'+homeTeam; 
    
    useEffect(() => {
    console.log('first step ok');
    setIt(it+1);
    const exceptions = [
        "Angeles",
        "Antonio",
        "Trail",
        "State",
        "Orleans",
        "York",
      ];
    if(exceptions.includes(homeName[1])){homeName[1]=homeName[2]}
    if(exceptions.includes(awayName[1])){awayName[1]=awayName[2]}

    const url = "http://balldontlie.fr/index.php/simulation/" + homeName[1] + "/" + awayName[1];
    const simulate = fetch(url)
        .then((response) => response.json())
        .then((data) => {
          return data;
        });

      simulate.then((d) => {
        setSimulated(d.data);
      })},[homeTeam, awayTeam])
    

   function bet(){
    if(homeOrAway=='0'){
      var odd = 1/(simulated.hWins / simulated.count);
    } else {
      var odd = 1/(simulated.aWins / simulated.count);
    }
    setIt(it+1);
    console.log({team:homeOrAway, odd:odd, user:props.user, balance, bets, it });
    
    // Send the registration data to your Symfony backend API
    fetch('index.php/bet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({team:homeOrAway, odd:odd, user:props.user,game:game,gameId:props.gameId,betAmount:betAmount}),
    })
      .then((response) => {
        if (response.status === 200 ) {
          setIt(it+1);
        } else {
          // Handle registration errors, e.g., display error messages
        }
      })
      .catch((error) => {
        // Handle network or other errors
      });
    };
	
    function showBets(game){
      useEffect(() => {
        let url = '/index.php/fetch-bets/'+game;
        fetch(url) // Replace with the correct API endpoint URL
          .then(response => response.json())
          .then(data => setBets(data))
          .catch(error => console.error('Error fetching data:', error));
      },[it,bets]);

      if(typeof(bets[0]) != "undefined")
	    { 
        return (<div><h3><span>Paris disponible pour ce match </span> : </h3>
          <table className="w-75 mx-auto table table-hover table-dark"> 
         {typeof(bets[0])!=='undefined' && bets.slice(0, 10).map((bet) => <tr key={bet.id}>
          <td>{bet.Game}</td>
          <td>{bet.HomeorAway== 1 ? 
          bet.Game.substring(bet.Game.indexOf("@")+1) :
            bet.Game.substring(0, bet.Game.indexOf("@"))}</td>
             <td> mise: {(bet.Amount*bet.Odd-bet.Amount).toFixed(2)} € </td><td> cote : {(1/(1-(1/bet.Odd))).toFixed(2)}</td>
          <td><button className="btn btn-primary" onClick={() => acceptBet(bet.id)}>Parier</button> </td>
          </tr>
          )}
          </table></div>
        )
      }
    //  else {return(<div> Aucun pari dispo pour ce match</div>)}
    }

  

    function acceptBet(id){
         // Send the registration data to your Symfony backend API
       fetch('index.php/acceptBet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user:props.user,id:id}),
    })
      .then((response) => {
        if (response.status === 200) {
          setIt(it+1);

         console.log('bet in db');
        } else {
          // Handle registration errors, e.g., display error messages
        }
      })
      .catch((error) => {
        // Handle network or other errors
      });
    }

    function getBalance(user)
    {
      useEffect(() => {
        let url = '/index.php/balance/'+user;
        fetch(url) // Replace with the correct API endpoint URL
          .then(response => response.json())
          .then(data => setBalance(data))
          .catch(error => console.error('Error fetching data:', error));
      },[it,bets]);
    return (<span>{balance}</span>)
    }

    function getBets(user)
    {
      useEffect(() => {
        let url = '/index.php/bets/'+user;
        fetch(url) // Replace with the correct API endpoint URL
          .then(response => response.json())
          .then(data => setUserBets(data))
          .catch(error => console.error('Error fetching data:', error));
      },[it,bets]);
      if(typeof(userBets[0]) != "undefined")
	    { 
        return (<div><table className="w-75 mx-auto table table-hover table-dark"> <tbody>
         { typeof(userBets[0])!=='undefined' && userBets.slice(0, 10).map((bet) => <tr key={bet.id}>
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
    }

    
    

    return (<div><h1>Bienvenue {props.user}</h1>
    <h2>Solde : {getBalance(props.user)}
     <br/> Paris en cours : {getBets(props.user)}
      </h2>
    <h3>{showBets(game)}</h3>
    <h3>Propose un pari pour ce match (remboursé si aucun preneur)</h3>

    <table className="w-75 mx-auto table table-hover table-dark"><tbody><tr>
      <td>Miser <input
          type="number"
          min="0"
          max="20"
          onChange={(e) => setBetAmount(e.target.value)}
          value={betAmount}
          /> € </td>
          <td> sur les
          <select name="homeOrAway" id="homeOrAwaySelect"  onChange={(e) => (setHomeOrAway(e.target.value))}>
              <option value='0'>{homeTeam}</option>
              <option value='1'>{awayTeam} </option>
          </select></td>
      <td>Cote :{homeOrAway==0 && simulated !== 0 &&
                      (1 / (simulated.hWins / simulated.count)).toFixed(2)}
                      {homeOrAway==1 && simulated !== 0 &&
                      (1 / (simulated.aWins / simulated.count)).toFixed(2)}
                      </td>
                      <td><button className="btn" onClick={() => bet({homeOrAway})}>Miser </button></td>         
      </tr></tbody></table>
    </div>
    )
  }

export default Dashboard;