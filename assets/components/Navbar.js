import React from 'react';
import { useState, useEffect } from 'react';
import '../styles/NavBar.css'
import Registration from './Registration'
import SignIn from './SignIn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';




function Navbar(props) {

  useEffect(() => {

  
  
  function getBalance(user)
  {
    if(props.registered =='Registration successful' ){
    
      let url = '/index.php/balance/'+user;
      fetch(url) // Replace with the correct API endpoint URL
        .then(response => response.json())
        .then(data => props.setBalance(data))
        .catch(error => console.error('Error fetching data:', error));
    }
  }

  getBalance(props.user);
  },[props]);

return ( <div><nav className="navbar navbar-expand-lg navbar-dark bg-dark">
<button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
  <span className="navbar-toggler-icon"></span>
</button>
<div className="collapse navbar-collapse" id="navbarNav">
  <ul className="navbar-nav">
    
    <li className={props.menuItem == 0 ? 'nav-item active' : 'nav-item' }>
      <a className="nav-link" onClick={()=>props.setMenuItem(0)}>Accueil
</a>
    </li>
    
    {props.user !== "" && <li className={props.menuItem == 2 ? 'nav-item active' : 'nav-item' }>
      <a className="nav-link" onClick={()=>props.setMenuItem(2)}>Mes paris
</a>
    </li>}
    <li className={props.menuItem == 3 ? 'nav-item active' : 'nav-item' }>
      <a className="nav-link" onClick={()=>props.setMenuItem(3)}>Face-à-Face
</a>
    </li>
    
  </ul>
</div>
<div className="navbar-text">
  <span className="user-info">{props.user !== "" ? 
    <span id="solde">{Number(props.balance).toFixed(2) }</span>: 
    <Registration teams={props.teams} gameNumber={props.gameNumber} gameId={props.gameId} registered={props.registered} setRegistered={props.setRegistered} user={props.user} setMenuItem={props.setMenuItem} menuItem={props.menuItem} />
}</span>
  <span className="user-info"><SignIn teams={props.teams} gameNumber={props.gameNumber} gameId={props.gameId} registered={props.registered} setRegistered={props.setRegistered} user={props.user} hTeamName={props.hTeamName} aTeamName={props.aTeamName} setMenuItem={props.setMenuItem} menuItem={props.menuItem} setShowSignIn={props.setShowSignIn} showSignIn={props.showSignIn} />
</span>
</div>
</nav>

    </div>)

}

export default Navbar
