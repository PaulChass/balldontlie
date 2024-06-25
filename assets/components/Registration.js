import React, { useState } from 'react';


function Registration(props) { 
  const [balance, setBalance] = useState('');



  
  function getBalance(user)
  {
    if(props.registered =='Registration successful' ){
    useEffect(() => {
      let url = '/index.php/balance/'+user;
      fetch(url) // Replace with the correct API endpoint URL
        .then(response => response.json())
        .then(data => setBalance(data))
        .catch(error => console.error('Error fetching data:', error));
    },[props.gameId,props.homeName,props.user]);
  return (<span>{balance}</span>)
  }}


  if(props.registered !=='Registration successful')
  {
    return (
            <div id="regButton">        
              <button className="btn btn-black" onClick={()=>{props.setMenuItem(5)}}>Creer un compte</button>
            </div>
    

  );
  } else {return ( 
          <div id="regButton">        
            <button className="btn btn-black" onClick={()=>{location.reload()}}>
              {props.user}:{getBalance(props.user)}</button>
          </div>)}
}


export default Registration;