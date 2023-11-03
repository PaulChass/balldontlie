import React from 'react';
import TeamsStatsArrays from './TeamStatsArray'



function TeamsStats(teams) {
  return (<div  key="TeamsStats" className="col-md-10 mx-auto">
              <TeamsStatsArrays  teams={teams}/>
                             </div>)
}
export default TeamsStats
