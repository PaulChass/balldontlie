import React, { useState } from 'react';
import Dashboard from './Dashboard';


function SignIn(props) {

 

  const [formData, setFormData] = useState({
    name: '',
    password: '',
    email: '',
    friends: [],
    balance: 0.0,
    bets: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Send the registration data to your Symfony backend API
    fetch('index.php/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
    .then((response) => response.json())
    .then((data) => {
      props.setRegistered(data.message);
      if(data.message !=='Registration successful')
      {
        document.getElementById('')
        alert(data.message)}
    })      
   
  }
  
  function toggleDisplaySignIn(){
    var signin = document.getElementById('signin');
    if (signin.style.display == "none") {
      signin.style.display = "block";
    } else {
      signin.style.display = "none";
    }
  }
 
  if(props.registered !=='Registration successful')
  {

    return (
      <div>      <div id="signButton">        <button className="btn btn-black" onClick={()=>{toggleDisplaySignIn()}}>Se connecter</button>
      </div>
      <div id="signin" style={{display:'none'}}>
      <h1>Se connecter</h1>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Identifiant</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            required
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Mot de passe</label>
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        {/* Add fields for friends, balance, and bets here */}
        <button type="submit">Se connecter</button>
      </form>
    </div>
    </div>
  );}
  else{

    return (<div>
      <Dashboard user={formData.name}  teams={props.teams} gameId={props.gameId}/>
      </div>)
  }
}


export default SignIn;