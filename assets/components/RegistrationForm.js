

import React, { useState, useEffect } from 'react';


function RegistrationForm(props) {
    

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
          else{
            props.setUser(formData.name);
            props.setRegistered(data.message);
  
            alert('Le compte a bien été créer');
            props.setMenuItem(0);
        }
        })      
    }
    
    if(props.menuItem==5) {
      return (
        <div id="reg" className='w-50 mx-auto bg-dark text-white justify-content-center align-items-center m-3 p-5' style={{opacity:0.8,borderRadius:"1rem"}}>
      <h2> Creer un compte </h2>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label className='form-label'>Name</label>
          <input
            type="text"
            name="name"
            className="form-control"
            value={formData.name}
            required
            onChange={handleChange}
          />
        </div>
        <div>
          <label className='form-label'>Password</label>
          <input
            type="password"
            name="password"
            className="form-control"
            required
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className='form-label'>Email</label>
          <input
            type="email"
            name="email"
            className="form-control"
            required
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        {/* Add fields for friends, balance, and bets here */}
        <button className='btn btn-primary mt-3' style={{marginLeft:"30%",width:"40%"}} type="submit">Register</button>
      </form>
    </div>
        )} return null;
}

export default RegistrationForm
