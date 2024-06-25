import React, { useState, useEffect } from 'react';

function TopFiveBetters()
{
    const [betters, setBetters] = useState([]);

  useEffect(() => {
    let url = '/index.php/users/by-balance/';
    fetch(url) // Replace with the correct API endpoint URL
      .then((response) => response.json())
      .then((data) => setBetters(data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <div className="betters text-white text-center col-lg-6  mx-auto bg-dark" style={{opacity:0.7,padding:"20px",borderRadius:"10px"}}>
      <h3 className="m-3 text-center col-8 mr-auto ml-auto ">
        Top parieurs
        </h3>
        <p className="col-8 m-auto" style={{ borderRadius: "1rem", opacity: 0.8, fontWeight: "bold" }}>

        { typeof(betters[0])!=='undefined' && betters.slice(0,5).map((better) =>
        <div className="better row justify-content-between">
            <span className='m-2'>{better.name} </span><span className='m-3'>{better.balance.toFixed(2)} </span>
        </div>     
        )}   </p>
    </div>
  )
}

export default TopFiveBetters