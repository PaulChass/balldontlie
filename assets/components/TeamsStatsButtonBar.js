import React from 'react';
import '../styles/TeamsStatsButtonBar.css'


function TeamsStatsButtonBar(
    { 
      lastNgames,setLastNGames,
      homeOrAway, setHomeOrAway,
      winLose,setWinLose,
      vsMatchup,setVsMatchup,
      paceAdjust, setPaceAdjust, 
      seasonType, setSeasonType
    }) {
    const style= {color:'white'};


    return(
    <form onSubmit={(e)=>{e.preventDefault();return false}}>
      
    <div className="row">
      <div className="p-2 form-group col-md-2 col-4">
          <label style={style} >X derniers:</label><br/>
          <input className="btn" type="number" id="lastNgames" onSubmit={(e)=>{e.preventDefault();return false;}} value={lastNgames} onChange={(e) => setLastNGames(e.target.value)}/>
        </div>
      
      <div className="p-2 form-group col-md-2 col-4">
          <label style={style} htmlFor="homeOrAway-select">Dom/Ext:</label><br/>
          <select className='btn' id="homeOrAway-select" name="homeOrAway" onChange={(e) => setHomeOrAway(e.target.value)} value={homeOrAway} >
            <option value="all">--Tous</option>
            <option value="Home">à domicile</option>
            <option value="Road">à l'éxterieur</option>
          </select>
      </div>

      <div className="p-2 form-group col-md-2 col-4">
        <label style={style} htmlFor="winLose-select">Win/Lose:</label><br/>
        <select className='btn' id="winLose-select" name="winLose" onChange={(e) => setWinLose(e.target.value)} value={winLose} >
          <option value="all">--Tous</option>
          <option value="W">Victoires uniquement</option>
          <option value="L">Défaites uniquement</option>
        </select>
      </div>

      <div className="p-2 form-group col-md-2 col-4">
        <label style={style} htmlFor="vsMatchup-select">Adversaire</label><br/>
        <select className='btn' id="vsMatchup-select" name="vsMatchup" onChange={(e) => setVsMatchup(e.target.value)} value={vsMatchup} >
          <option value='0'>--Tous</option>
          
          <option value='1610612737'>Atlanta</option>
          <option value='1610612738'>Boston</option>
          <option value='1610612751'>Brooklyn</option>
          <option value='1610612766'>Charlotte</option>
          <option value='1610612741'>Chicago</option>

          <option value='1610612739'>Cleveland</option>
          <option value='1610612742'>Dallas</option>
          <option value='1610612743'>Denver</option>
          <option value='1610612765'>Detroit</option>
          <option value='1610612744'>Golden State</option>


          <option value='1610612745'>Rockets</option>
          <option value='1610612754'>Pacers</option>
          <option value='1610612746'>LA Clippers</option>
          <option value='1610612747'>LA Lakers</option>
          <option value='1610612763'>Memphis</option>

          <option value='1610612748'>Miami</option>
          <option value='1610612749'>Milwaukee</option>
          <option value='1610612750'>Minnesota </option>
          <option value='1610612740'>New Orleans</option>
          <option value='1610612752'>New York</option>

          <option value='1610612753'>Orlando</option>
          <option value='1610612760'>Oklahoma</option>
          <option value='1610612755'>Philadelphie</option>
          <option value='1610612756'>Phoenix</option>
          <option value='1610612757'>Portland</option>


          <option value='1610612758'>Sacramento</option>
          <option value='1610612759'>San Antonio</option>
          <option value='1610612761'>Toronto</option>
          <option value='1610612762'>Utah</option>
          <option value='1610612764'>Washington</option>



        </select>
      </div>

      <div className="p-2 form-group col-md-2 col-4">
        <label style={style} htmlFor="PaceAdjust">Pace ajustée </label><br/>
        <select className='btn' id="PaceAdjust" name="PaceAdjust" onChange={(e) => setPaceAdjust(e.target.value)} value={paceAdjust} >
          <option value='N'>Non</option>
          <option value='Y'>Oui</option>
        </select>
      </div>

      <div className="p-2 form-group col-md-2 col-4">
        <label style={style} htmlFor="SeasonType">Type de saison </label><br/>
        <select className='btn' id="SeasonType" name="SeasonType" onChange={(e) => setSeasonType(e.target.value)} value={seasonType} >
          <option value='Playoffs'>Playoffs</option>
          <option value='Regular+Season'>Saison Régulière</option>
        </select>
      </div>



      
    </div>
  </form>)
}

export default TeamsStatsButtonBar
