import React, { useState, useEffect } from 'react';

function LastNightGames()
{
    const [games, setGames] = useState([]);

  useEffect(() => {
    let url = '/index.php/lastnightgames';
    fetch(url) // Replace with the correct API endpoint URL
      .then((response) => response.json())
      .then((data) => setGames(data.data))
      .catch((error) => console.error("Error fetching data:", error));
    const intervalId = setInterval(() => {

    let url = '/index.php/lastnightgames';
    fetch(url) // Replace with the correct API endpoint URL
      .then((response) => response.json())
      .then((data) => setGames(data.data))
      .catch((error) => console.error("Error fetching data:", error));
    
    }, 10000);
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="games text-white text-center w-100 mx-auto">
      <h3 className="m-3 text-center col-8 mr-auto ml-auto p-3">
          Derniers résultats
          </h3>
      <div className="bg-dark  col-6 m-auto p-2" style={{borderRadius:"5px"}}>
        
          <p className="" style={{ borderRadius: "1rem", opacity: 0.8, fontSize: "1.1rem" }}>
          { typeof(games[0])!=='undefined' && games.map((game) =>
          <div className="game row justify-content-around">
              <span className='m-2'>{game.matchup} </span><span className='m-3'> {game.homeScore} - {game.awayScore} </span>
          </div>     
          )}   </p>
      </div>
    </div>
  )
}

export default LastNightGames