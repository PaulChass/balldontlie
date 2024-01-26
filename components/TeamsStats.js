import React from 'react';
import TeamsStatsArrays from './TeamStatsArray'



function TeamsStats(props) {

  
  if(props.hTeamName !== 0){    return (<div  key="TeamsStats" className="col-lg-10 mx-auto">
              <TeamsStatsArrays  teams={props.teams}   hTeamName={props.hTeamName} setHTeamName={props.setHTeamName}
              aTeamName={props.aTeamName} setATeamName = {props.setATeamName}
              registered={props.registered} user={props.user} gameId={props.gameId} startTime={props.startTime} startDate={props.startDate} it={props.it} setIt={props.setIt} setBalance={props.setBalance}
              /></div>)
  } else {
    return <h2>Clique sur un match en haut de page pour voir les paris disponibles sur ce match </h2> }   
}
export default TeamsStats
