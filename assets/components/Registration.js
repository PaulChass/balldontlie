import React, { useState } from 'react';
import Dashboard from './Dashboard';


function Registration(props) { 

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
    fetch('index.php/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
    .then((response) => response.json())
    .then((data) => {
      if(data.message !=='Registration successful')
      {alert(data.message)}
      else{toggleDisplayRegistration();
      alert('Le compte a bien été créer')}
    })      
  };

  function toggleDisplayRegistration(){
    var reg = document.getElementById('reg');
    if (reg.style.display == "none") {
      reg.style.display = "block";
    } else {
      reg.style.display = "none";
    }
  }
  


  if(props.registered !=='Registration successful')
  {
    
   

    return (
      <div>      <div id="regButton">        <button className="btn btn-black" onClick={()=>{toggleDisplayRegistration()}}>Creer un compte</button>
      </div>
    <div id="reg" style={{display:'none'}}>
      <h1>Creer un compte </h1>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            required
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        {/* Add fields for friends, balance, and bets here */}
        <button type="submit">Register</button>
      </form>
    </div></div>

  );}
  else{
    return null;
}
}


export default Registration;