

import React, { useState, useEffect } from 'react';


function SignInForm(props) {


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
            alert(data.message)
          } else { 
            props.setMenuItem(2);
            props.setUser(formData.name)};
        })      
       
      }
    
    if(props.menuItem==6){
      return(
        <div id="signin" className='w-50 mx-auto bg-dark text-white justify-content-center align-items-center m-3 p-5' style={{opacity:0.8,borderRadius:"1rem"}}>
              <h2 className='text-center'>Se connecter</h2>
              
              <form onSubmit={handleSubmit}>
                <div>
                  <label className='form-label'>Identifiant</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    className="form-control"
                    required
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className='form-label'>Mot de passe</label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                {/* Add fields for friends, balance, and bets here */}
                <button type="submit" className='btn btn-primary mt-3' style={{marginLeft:"30%",width:"40%"}}>Se connecter</button>
              </form>
            </div>)}else {return null;}
} 

export default SignInForm
