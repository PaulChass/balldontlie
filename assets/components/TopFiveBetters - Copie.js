import React, { useState, useEffect } from 'react';

function LastNightGames()
{
    const [games, setGames] = useState([]);

  useEffect(() => {
    let url = '/index.php/lastnightgames/';
    fetch(url) // Replace with the correct API endpoint URL
      .then((response) => response.json())
      .then((data) => setGames(data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <div className="games text-white text-center w-100">
      <h3 className="m-3 text-center col-8 mr-auto ml-auto">
        Top parieurs
        </h3>
        <p className="" style={{ borderRadius: "1rem", opacity: 0.8, fontSize: "1.1rem" }}>

        { typeof(games[0])!=='undefined' && games.map((better) =>
        <div className="game row justify-content-around">
            <span className='m-2'>{game.matchup} </span><span className='m-3'>{game.awayScore}-{game.homeScore} </span>
        </div>     
        )}   </p>
    </div>
  )
}

export default LastNightGames