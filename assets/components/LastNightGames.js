import React, { useState, useEffect } from 'react';

function LastNightGames()
{
    const [games, setGames] = useState([]);

  useEffect(() => {
    const url = '/index.php/lastnightgames';
    // Les résultats de la nuit ne bougent pas : on garde l'écran existant si un
    // appel échoue (non bloquant), et on rafraîchit lentement pour ne pas saturer.
    const load = () =>
      fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.json();
        })
        .then((data) => setGames(data && Array.isArray(data.data) ? data.data : []))
        .catch((error) => console.error('Error fetching data:', error));

    load();
    const intervalId = setInterval(load, 300000); // 5 min
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="games text-white text-center col-lg-10 w-100 mx-auto">
      <h3 className="m-3 text-center col-8 mr-auto ml-auto p-3">
          Derniers résultats
          </h3>
      <div className="bg-dark  col-6 m-auto p-3" style={{borderRadius:"10px"}}>
        
          <p className="" style={{ borderRadius: "2rem", opacity: 0.7, fontSize: "1.1rem" }}>
          { typeof(games[0])!=='undefined' && games.map((game) =>
          <div className="game row justify-content-around">
              <span className='m-3'>{game.matchup} </span><span className='m-3'> {game.homeScore} - {game.awayScore} </span>
          </div>     
          )}   </p>
      </div>
    </div>
  )
}

export default LastNightGames