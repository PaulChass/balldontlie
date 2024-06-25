import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';


function SignIn(props) {

  
 
  if(props.registered !=='Registration successful')
  {

    return (
      <div>      
        <div id="signButton">        
          <button className="btn btn-black" onClick={()=>{props.showSignIn? props.setShowSignIn(false):props.setShowSignIn(true)}}>
            Connexion
          </button>
        </div>
      </div>
      );
  } else {
    return ( 
    <div id="regButton">        
      <button className="btn btn-black" onClick={()=>{}}>
        {props.user}</button>
    </div>)
  }
}


export default SignIn;