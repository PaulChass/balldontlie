import React from 'react';
import { useState, useEffect } from 'react';


function Simulation(props) {
        const [simulated,setSimulated] = useState(0);
        
		useEffect(() => {	
			if(props.hTeamName !== 0){
				console.log(props.hTeamName);
				const exceptions = ['Angeles','Antonio','Trail','State','Orleans','York'];	
				
				const homeTeam = props.hTeamName.split(' ');
				let hName = homeTeam[1];
				if(exceptions.includes(hName)){hName=homeTeam[2]}
				if(hName=="Blazers"){hName = "TBlazers"}
				if(hName=="Timberwolves"){hName = "TWolves"}

				const awayTeam = props.aTeamName.split(' ');
				let aName = awayTeam[1];
				if(exceptions.includes(aName)){aName=awayTeam[2]}
				if(aName=="Blazers"){aName = "TBlazers"}
				if(aName=="Timberwolves"){aName = "TWolves"}
				const url = "https://balldontlie.fr/index.php/simulation/"+hName+'/'+aName

				const simulate = fetch(url)
				.then((response) => response.json()) 
				.then((data) => {
				return data 
				}); 

				simulate.then((d) => { 
					setSimulated(d.data);
				})
			}
		},[props.teams])
	  const x = simulated.hOdds;
	  const y = simulated.aOdds;
	  const px = 100/x;//proba site de pari
	  const py = 100/y;
	  const pxprime=px/(px+py);
	  const pyprime=py/(py+px);//proba ajustee
 
	
	  const xprime = 1/pxprime;
	  const yprime = 1/pyprime;  //proba ajustee

        

  		return (<div className='text-white'><h1 className='text-white fs-2 text-center p-3 m-3'>Simulation</h1>
  
  

 		<table className="table table-dark">
        	<caption className="text-white text-center" style={{captionSide:"top"}}><em>Simulé {simulated !== 0 && simulated.count} fois </em></caption>
    	<thead>
    		<tr>
    			<th></th>
    			<th scope="col"> Résultat simulation </th>
			<th scope="col"> Cote simulée </th>
			{isNaN(xprime) == false && <th scope="col"> Cote Parions Sport </th>}
			{isNaN(xprime) == false && <th scope='col'> Cote calculée </th> }
    		</tr>
    	</thead>
    	<tbody>
    		<tr>
	    		<th scope="row"> {props.hTeamName} </th>
			<td> {simulated !== 0 && simulated.hWins+'    '}  
	    		    ( {simulated !== 0 && ((simulated.hWins / simulated.count)* 100).toFixed(1) }% )
	    		</td>
				<td> {simulated !== 0 && (1/((simulated.hWins / simulated.count))).toFixed(2)}</td>
			{isNaN(xprime) == false && 
			<td>{simulated.hOdds}</td> && 
			<td> {xprime.toFixed(2)}</td>}
		</tr>
		<tr>
			<th scope="row"> {props.aTeamName} </th>
			<td> {simulated !== 0 && simulated.aWins+'    '}  
	    		    ( {simulated !== 0 && ((simulated.aWins / simulated.count)* 100).toFixed(1) }% )
	    		</td>
			<td> {simulated !== 0 && (1/((simulated.aWins / simulated.count))).toFixed(2)}</td>
			{isNaN(xprime) == false && 
			<td>{simulated.aOdds}</td> &&
			<td>{yprime.toFixed(2)}</td>
			}
		</tr>
	</tbody>
	</table>    		

  </div>)


}

export default Simulation
