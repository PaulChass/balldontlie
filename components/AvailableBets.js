import React, { useState, useEffect } from 'react';
import '../styles/AvailableBets.css';

function AvailableBets(props) {
 const [bets, setBets] = useState([]);
 const [itb, setItb] = useState(0);
 const [day,setDay] =useState(0);
 const [betsType, setBetsType] = useState('all');

 

    useEffect(() => {
        let url = '/index.php/availableBets/';
        fetch(url) // Replace with the correct API endpoint URL
          .then(response => response.json())
          .then(data => setBets(data.reverse()))
          .catch(error => console.errors('Error fetching data:', error));
      },[props,itb,betsType]);

      var date = new Date(); 

      for (let i = 0; i < bets.length; i++) {
        

          let startTimes=bets[i].startTime.split(':');
          if(startTimes[0]>6){
           if(date.getHours()>startTimes[0]) 
           {
            bets.splice(i,1);
            i--;
           }
           if(date.getHours()<6)
           {
            bets.splice(i,1);
            i--;
           }
          }
          else{
           if(date.getHours()<6 && date.getHours()>startTimes[0]) 
           {
            bets.splice(i,1);
            i--;
           }
          }
      }

      
      function getBalance(user)
      {
    
      let url = '/index.php/balance/'+user;
      fetch(url) // Replace with the correct API endpoint URL
        .then(response => response.json())
        .then(data => props.setBalance(data))
        .catch(error => console.error('Error fetching data:', error));
       }


      function acceptBet(id,startTime,startDate,type,typeValue){
        if(props.registered=='Registration successful'){
                // Send the registration data to your Symfony backend API
            fetch('index.php/acceptBet', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user:props.user,id:id,startTime:startTime,startDate:startDate,type:type,typeValue:typeValue}),
         })
            .then((response) => {
            if (response.status === 200) {
              setItb(itb+1);
                alert('pari accepté');
                
            } else {
              alert('pari accepté');
            }
            })
            .catch((error) => {
        // Handle network or other errors
          });
        }
        else {alert('Vous devez être connecté pour accepter ce pari');}
      } 
      
      function timeToBet()
      {
        var date = new Date();
        var clockTime = date.toLocaleTimeString();
        var clockTimes = clockTime.split(':');
        var hour = date.getHours();
        var day = date.getDate();
        var el=0;
        var elementId=0;
        if(hour<6){
          day=day-1;
        }
        setDay(day);
        if(bets.length!==0){
        for (let index = 0; index < bets.length; index++) {
            var startTime = bets[index]['startTime'];
            var startTimes = startTime.split(':');
            startTimes[0] = parseInt(startTimes[0]);
            startTimes[1] = parseInt(startTimes[1]);
            if(startTimes[0]<6){
              startTimes[0]= startTimes[0]+24
            } 
            var h = startTimes[0]-parseInt(clockTimes[0]);
            var m = startTimes[1]-parseInt(clockTimes[1]);
           
            var s = 60 - parseInt(clockTimes[2]);
            if(s!=60){m =m-1} else {s=0};
            if(m<0){ m = 60+m; h=h-1;}
            if(h>=24){h=h-24;}
            elementId='atimeToBet'+bets[index]['id'];
            el = document.getElementById(elementId);
            if(el!==null){el.innerHTML = h + 'h' + m + 'm' + s +'s';}
          }}
      }
      
      setInterval(timeToBet, 1000);
    
    
    var today = new Date(); 
    var d = today.getDate();
    if(today.getHours()<6){
      d=d-1;
    }
    

    for (let i = 0; i < bets.length; i++) {
      var monthAndOne = today.getMonth()+1;
      if(bets[i].startDate !== today.getFullYear()+'-'+monthAndOne+'-'+d)
      { 
        bets.splice(i,1);  
        i=i-1;
      }
      if(bets[i] !== undefined){
      var startTimes = bets[i].startTime;
      var startHourMinutes = startTimes.split(':')
        if(today.getHours()<6 && today.getHours()> startHourMinutes[0])
        {
          bets.splice(i,1);  
          i=i-1;
        }
        if(today.getHours()<6 && today.getHours() == startHourMinutes[0] && today.getMinutes < startHourMinutes[1])
        {
          bets.splice(i,1);  
          i=i-1;
        }

      }
    }


    for (let index = 0; index < bets.length; index++) {
      
      if(betsType == 'player' && bets[index].type == null){
        bets.splice(index,1);  
        index--;
      }
      if(betsType == 'team' && bets[index].type !== null ){
        bets.splice(index,1);  
        index--;
      }
    }
    
    return (<div className="availableBets  mx-auto col-md-10">
      <span>{props.user!=='' && getBalance(props.user)}</span>
      {props.registered!=='Registration successful'&&(
      <div className='text-white text-center w-100'>
      <h2 className='m-3 text-center'>Bienvenue sur balldontlie.fr</h2>
      <h3  className='m-3 text-center'>Le site de Paris NBA entre Particuliers !</h3>
        <p className='bg-dark p-5' style={{borderRadius:"1rem",opacity:0.8,fontSize:"1.1rem"}}>
        Pari avec des meilleurs cotes que les sites traditionnels de paris en jouant entre passionnés de basketball.

        <br/>
        <br/>
        Comment ça marche :
        <br/>
        <br/>
        <strong>Inscris-toi :</strong> Crée ton compte en quelques instants.
        <br/>
        <strong>Explore les Paris </strong>: Parcours les paris disponibles pour les prochains matchs.
        <br/>
        <strong>Défi les autres parieurs : </strong>Propose des paris sur les matchs à venir.
        <br/>
        <br/>

        Prêt à plonger dans l'action ? Inscris-toi maintenant et commence à parier !
        </p></div>)}
      <h2 className='text-white text-center m-3'> Paris disponibles </h2>
    
     
      <div className="btn-group justify-content-around col-12 mr-auto ml-auto mb-2 mt-4" style={{opacity:0.8}} role="group" >
            <button type="button" className={`btn ${betsType === 'all' ? 'btn-dark p-2 m-1 active' : 'btn-dark p-2 m-1'}`} style={{borderRadius:"1rem"}} onClick={() => setBetsType('all')}>Tous</button>
            <button type="button" className={`btn ${betsType === 'team' ? 'btn-dark p-2 m-1 active' : 'btn-dark p-2 m-1'}`} style={{borderRadius:"1rem"}} onClick={() => setBetsType('team')}>Vainqueur</button>
            <button type="button" className={`btn ${betsType === 'player' ? 'btn-dark p-2 m-1 active' : 'btn-dark p-2 m-1'}`} style={{borderRadius:"1rem"}} onClick={() => setBetsType('player')}>Stat joueur</button>
        </div>
    
    
    {typeof (bets[0]) !== 'undefined' && bets.slice(0, 10).map((bet,index) => (
    <div key={bet.id} id={'availableBet'+bet.id}  className="availableBet card bg-dark text-white mb-4" style={{borderRadius:"2rem"}}>
    <div class="card-header d-flex justify-content-between">
    <h5 className="card-title gameName">{bet.Game}</h5>
    <span className='text-right font-weight-light font-italic'>proposé par {bet.username}</span>

    </div>
    <div className="card-body">
      <div className="gameInfo  d-flex justify-content-between">
        <p className="card-text teamName">
          {(bet.HomeorAway === 1 && bet.type == null) &&
            'Vainqueur: ' +bet.Game.substring(bet.Game.indexOf("@") + 1)}
            

          {(bet.HomeorAway === 0 && bet.type == null) &&
            'Vainqueur: ' +bet.Game.substring(0, bet.Game.indexOf("@"))}
            
          {bet.type != null && bet.HomeorAway === 0
          && 'Moins de '+bet.typeValue+' '+bet.type}
            {bet.type!= null && bet.HomeorAway === 1 && Number.isInteger(parseFloat(bet.typeValue))==true
          && 'Plus de ' + (parseInt(bet.typeValue)-0.5) +' '+bet.type}
          {bet.type!= null && bet.HomeorAway === 1 && Number.isInteger(parseFloat(bet.typeValue))==false
          && 'Plus de ' +bet.typeValue+' '+bet.type}

        </p>
        {(bet.type != null) && 
          <img src={"https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/1040x760/"+bet.playerId+".png"} style={{height:"3rem"}}/>}
        {bet.HomeorAway === 0 && bet.type == null &&
          <img src={bet.aLogo} style={{height:"3rem"}}/>}
        {bet.HomeorAway === 1 && bet.type == null &&
          <img src={bet.hLogo} style={{height:"3rem"}}/>}


      </div>
      <div className="betDetails mb-2">
        <p className="card-text mise">Mise: {(bet.Amount * bet.Odd - bet.Amount).toFixed(2)} €</p>
        <p className="card-text cote">Cote: {(1 / (1 - 1 / bet.Odd)).toFixed(2)}</p>
      </div>
      <div className="betDetails mb-3">
        <p className="card-text gains">Gains: {((1 / (1 - 1 / bet.Odd))*(bet.Amount * bet.Odd - bet.Amount)).toFixed(2)} €</p>
        <p className="card-text timeRemaining">Temps restant: <span id={'atimeToBet' + bet.id}></span></p>
      </div>
      <button className="btn btn-primary  btn-lg btn-block" onClick={() => acceptBet(bet.id,bet.startTime,bet.startDate,bet.type,bet.typeValue)}>Parier</button>
    </div>
  </div>
    ))}
  </div>

            
          )
}
export default AvailableBets
