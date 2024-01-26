



import React, { useState, useEffect } from 'react';

function myBets(props) {

    const [bets, setBets] = useState(0);
    const [betsStatus, setBetsStatus] = useState('all');
    const [isLoading, setLoading] = useState(true);

  
    var showNBets=15;

    useEffect(() => {
        let url = '/index.php/bets/'+props.user;
        fetch(url) // Replace with the correct API endpoint URL
          .then(response => response.json())
          .then((data) => {setBets(data);setLoading(false)})
          .catch(error => console.error('Error fetching data:', error));
      },[props,betsStatus]);
      
      if(isLoading==false && bets.length==0){
        setBets(0);
      }
      
      for (let index = 0; index < bets.length; index++) {
        const betStatus = bets[index].Status;
        if(betStatus !== betsStatus && betsStatus !== 'all' ){
          if(betStatus == 'accepted' && betsStatus == 'pending' ){}else{
          bets.splice(index,1);  
          index--;
          }
        }
      }
      
      if(bets !== 0)
	    { 
        

        return (<div id="myBets" className='col-lg-10' style={{display: props.menuItem == 2 ? 'block' : 'none',margin:"auto"}}>
          
        <h2 className='text-white text-center m-3'>Historique des paris</h2>
        
        <div className="btn-group justify-content-around col-12 mr-auto ml-auto mb-2 mt-4" style={{opacity:0.8}} role="group" >
            <button type="button" className={`btn ${betsStatus === 'all' ? 'btn-dark p-2 m-1 active' : 'btn-dark p-2 m-1'}`} style={{borderRadius:"1rem"}} onClick={() => setBetsStatus('all')}>Tous</button>
            <button type="button" className={`btn ${betsStatus === 'pending' ? 'btn-dark p-2 m-1 active' : 'btn-dark p-2 m-1'}`} style={{borderRadius:"1rem"}} onClick={() => setBetsStatus('pending')}>En cours</button>
            <button type="button" className={`btn ${betsStatus === 'Won' ? 'btn-dark p-2 m-1 active' : 'btn-dark p-2 m-1'}`} style={{borderRadius:"1rem"}} onClick={() => setBetsStatus('Won')}>Gagnés</button>
            <button type="button" className={`btn ${betsStatus === 'Lost' ? 'btn-dark p-2 m-1 active' : 'btn-dark p-2 m-1'}`} style={{borderRadius:"1rem"}} onClick={() => setBetsStatus('Lost')}>Perdus</button>
        </div>

        <table className="col-md-10 mx-auto table table-hover table-dark"> <tbody>
         { typeof(bets[0])!=='undefined' && bets.slice(-showNBets).reverse().map((bet) => <tr key={bet.id}>
          <td>{bet.Game}</td>
          <td>{(bet.HomeorAway === 0 && bet.type == null)
            ? bet.Game.substring(bet.Game.indexOf("@") + 1)
            : bet.Game.substring(0, bet.Game.indexOf("@"))}
          {bet.type != null && bet.HomeorAway === 0
          && 'Moins de '+bet.typeValue+' '+bet.type}
            {bet.type!= null && bet.HomeorAway === 1
          && 'Au moins  '+bet.typeValue+' '+bet.type}
          </td>
             <td> mise: {bet.Amount} € </td><td> cote : {bet.Odd.toFixed(2)}</td>
          <td>Statut: {bet.Status == 'accepted' ? 'En cours' : bet.Status }</td>
          </tr>
          )}
          </tbody></table></div>
        )
        }
        else {
          if (isLoading) {
            return (<div id="myBets" className='col-lg-10' style={{display: props.menuItem == 2 ? 'block' : 'none',margin:"auto"}}>
              <h2 className='text-white text-center m-3'>Historique des paris</h2>
              <span className='text-white text-center m-3'>Chargement en cours   </span>
              <i class="text-white fa fa-spinner fa-spin" style={{fontSize:"2rem"}}></i></div>)
          }
          else
          {          
            return (<div id="myBets" className='col-lg-10' style={{display: props.menuItem == 2 ? 'block' : 'none',margin:"auto"}}>
          
          <h2 className='text-white text-center m-3'>Historique des paris</h2>
          <p className='text-white text-center'>Aucun pari pour le moment</p>
          </div>)
  
          }  
        }
      }


export default myBets