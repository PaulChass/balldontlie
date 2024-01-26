import React, { useState, useEffect } from 'react';

function GameBets(props) {

    const [bets, setBets] = useState([]);

    var homeTeam = props.hTeamName;
    var awayTeam = props.aTeamName;
    var  game = awayTeam+'@'+homeTeam; 


    function showBets(game){
      
        useEffect(() => {
          let url = '/index.php/fetch-bets/'+game;
          fetch(url) // Replace with the correct API endpoint URL
            .then(response => response.json())
            .then(data => setBets(data))
            .catch(error => console.error('Error fetching data:', error));
        },[props]);
  
        if(typeof(bets[0]) != "undefined")
          { 
          return (<div><h3><span>Paris disponible pour ce match </span> : </h3>
            <table className="col-md-10 mx-auto table table-hover table-dark"> 
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
        }
        })
        .catch((error) => {
        // Handle network or other errors
        });
    }


    return (<h3>{showBets(game)}</h3>)
}


export default GameBets
