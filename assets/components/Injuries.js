import React from 'react';
import { useState, useEffect } from 'react';


function Injuries({teams, aTeamName, hTeamName}) {
  const [hInjured,setHInjured] = useState(0);
  const [aInjured,setAInjured] = useState(0);
  

  useEffect(() => {
    if(teams[0] !== 0){
    const hInjuryUrl = "http://192.168.1.20:8000/index.php/injuries/"+teams.teams[0];
    const aInjuryUrl = "http://192.168.1.20:8000/index.php/injuries/"+teams.teams[1];
   
    
    const hinjuries = fetch(hInjuryUrl) //1
    .then((response) => response.json()) //2
    .then((data) => {
      return data //3
    });
    const ainjuries = fetch(aInjuryUrl) //1
    .then((response) => response.json()) //2
    .then((data) => {
      return data //3
    });
    const getInjuries = () => {
        hinjuries.then((h) => { setHInjured(h.data)})
        ainjuries.then((a) => { setAInjured(a.data) })
    }

    getInjuries();}
    
   },teams.teams)
  

   function showInjuries(injured,teamName)
  {
    return (<div className='col-6 my-0'><table className="table table-dark">
      <caption style={{ captionSide: 'top', color: 'white', textAlign: 'center' }}>{teamName}</caption>
      <thead>
        <tr>
          <th scope='col'>Nom</th>
          <th scope='col'>Blessure</th>
          <th scope='col'>Statut</th>
        </tr>
      </thead>

      <tbody>
      {injured.map((injuredPlayer) => <tr key={injuredPlayer.player}>
        <td>{injuredPlayer.player}</td>
        <td>{injuredPlayer.injury}</td>
        <td>{injuredPlayer.status}</td>

        </tr>)}
      </tbody>
    </table></div>)
    

  }

  return (<div><h1 className='text-white fs-2 text-center p-3 m-3'>Infirmerie (source espn)</h1><div className='d-flex '> 
    { hInjured !== 0 ? showInjuries(hInjured,hTeamName): null}
    { aInjured !== 0 ? showInjuries(aInjured,aTeamName): null}
  </div></div>)


}

export default Injuries
