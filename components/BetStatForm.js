import React, { useState, useEffect } from 'react';
import '../styles/PlayersStatsArray.css'

function betStatForm(props) {
  const [betAmount,setBetAmount] =useState(10);
  const [betTypeAmount,setBetTypeAmount] =useState(0);
  const [homeOrAway,setHomeOrAway] =useState(0);
  const [betOdd,setBetOdd] =useState(2);

  useEffect(() => {
    setBetTypeAmount(props.statValue);
  },[props.statValue]); 




  function bet(){ 
    if(props.registered =='Registration successful' ){
      props.setIt(props.it+1);    
    // Send the registration data to your Symfony backend API
    
       fetch('index.php/bet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({team:homeOrAway, odd:betOdd, user:props.user,game:props.name,gameId:props.gameId,betAmount:betAmount,startTime:props.startTime,startDate:props.startDate,betType:props.stat,betTypeAmount:betTypeAmount,playerId:props.id}),
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
  
  
  
  
  return(<div style={{marginTop:"3rem",marginBottom:"3rem"}}><table className="col-md-10  table table-hover table-dark bg-dark text-white large" style={{borderRadius:"4rem",opacity:0.8,margin:"auto"}}><tbody><tr>
  <td style={{padding:"2rem"}}>Miser <input
      type="number"
      min="0"
      max="20"
      className='form-control p-2 text-white text-center'
      onChange={(e) => setBetAmount(e.target.value)}
      value={betAmount}
      /> </td>
      <td> sur {props.name}
      <select className='custom-select p-2 text-white text-center' name="homeOrAway" id="homeOrAwaySelect"  onChange={(e) => (setHomeOrAway(e.target.value))}>
          <option value='0' style={{color:"black",backgroundColor:'white',textAlign:'center'}}>
            Au moins</option>
          <option value='1'style={{color:"black",backgroundColor:'white',textAlign:'center'}}>
            Moins de</option>
      </select></td>
      <td><span>{props.stat}</span><input
      type="number"
      min="1"
      max="100"
      className='form-control p-2 text-white text-center'
      onChange={(e) => setBetTypeAmount(e.target.value)}
      value={betTypeAmount}
      />
      </td>
      <td style={{padding:"2rem"}}>Cote <input
      type="number"
      min="1"
      max="20"
      className='form-control p-2 text-white text-center'
      onChange={(e) => setBetOdd(e.target.value)}
      value={betOdd}
      /> </td>
      <td><button className="btn btn-primary w-50 " onClick={() => bet()}>  Miser </button></td>         
  </tr></tbody>
  </table></div>)
}

export default betStatForm
