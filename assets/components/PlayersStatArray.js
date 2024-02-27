import React from "react";
import { useState, useEffect } from "react";
import StatGraph from "./StatGraph";
import "../styles/PlayersStatsArray.css";
import BetStatForm from "./BetStatForm";
import { array, func } from "prop-types";

function PlayersStats(props) {
  const [hPlayersStats, setHPlayersStats] = useState(0);
  const [aPlayersStats, setAPlayersStats] = useState(0);
  const [graphParam, setGraphParam] = useState([0, 0]);
  const [formParam, setFormParam] = useState([0, 0, 0]);
  const [sortBy, setSortBy] = useState(["minutes", 0]);

  const [playerNames, setPlayerNames] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showStat, setShowStat] = useState("points");
  const [player, setPlayer] = useState("");
  const [homeIsLoading, setHomeIsLoading] = useState(true);
  const [awayIsLoading, setAwayIsLoading] = useState(true);


  useEffect(() => {
    if (typeof props.teams !== "undefined" && props.teams[0] !== 0) {
      var homeUrl =
        "https://balldontlie.fr/index.php/playersStats/" +
        props.teams[0] +
        "/" +
        props.lastNgames +
        "/" +
        props.homeOrAway +
        "/" +
        props.winLose +
        "/" +
        props.vsMatchup +
        "/" +
        props.paceAdjust +
        "/" +
        props.seasonType;
      var awayUrl =
        "https://balldontlie.fr/index.php/playersStats/" +
        props.teams[1] +
        "/" +
        props.lastNgames +
        "/" +
        props.homeOrAway +
        "/" +
        props.winLose +
        "/" +
        props.vsMatchup +
        "/" +
        props.paceAdjust +
        "/" +
        props.seasonType;
      setHomeIsLoading(true);
      const hteamStats = fetch(homeUrl) //1
        .then((response) => response.json()) //2
        .then((team) => {
          setHomeIsLoading(false);
          return team; //3
        });

      setAwayIsLoading(true);
      const ateamStats = fetch(awayUrl) //1
        .then((response) => response.json()) //2
        .then((team) => {
          setAwayIsLoading(false);
          return team; //3
        })
      const getTeamsStats = () => {
        hteamStats.then((h) => {
          if (sortBy[1] == 0) {
            setHPlayersStats(orderBy(h.data, sortBy[0]).reverse());
          } else {
            setHPlayersStats(orderBy(h.data, sortBy[0]));
          }
        });
        ateamStats.then((a) => {
          if (sortBy[1] == 0) {
            setAPlayersStats(orderBy(a.data, sortBy[0]).reverse());
          } else {
            setAPlayersStats(orderBy(a.data, sortBy[0]));
          }
        });
      };
      
      getTeamsStats();

      setFormParam([0,0,0]);
      setGraphParam([0,0]);
    }
  }, [
    props.teams,
    props.lastNgames,
    props.homeOrAway,
    props.winLose,
    props.vsMatchup,
    props.paceAdjust,
    props.seasonType,
    sortBy,
  ]);

  const handleSearch = (event) => {
    var hPlayerNames = [];
  var aPlayerNames = [];
  for (let index = 0; index < hPlayersStats.length; index++) {
    hPlayerNames[index] = hPlayersStats[index].name;
  }
  for (let index = 0; index < aPlayersStats.length; index++) {
    aPlayerNames[index] = aPlayersStats[index].name;
  }
   let layerNames = hPlayerNames.concat(aPlayerNames);
    const term = event.target.value;
    setSearchTerm(term);
    document.getElementById("playerList").style.display = "block";
    
    // Filter player names based on the search term
    const results = layerNames.filter((name) =>
      name.toLowerCase().includes(term.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleSelect = (selectedPlayer) => {
    // Handle the selected player (e.g., update state, perform an action)
   
    setPlayer(selectedPlayer);
    getPlayerGraph(selectedPlayer, showStat);
    document.getElementById("playerList").style.display = "none";
    setSearchTerm("");
  };

  

  
  function getPlayerGraph(selectedPlayer, stat) {
    var foundId = 0;
    while (foundId == 0) {
      for (let index = 0; index < hPlayersStats.length; index++) {
        if (selectedPlayer == hPlayersStats[index].name) {
          foundId = hPlayersStats[index].id;
          switch (showStat) {
            case "points":
              var statValue = hPlayersStats[index].points;
              break;
            case "rebounds":
              var statValue = hPlayersStats[index].rebounds;
              break;
            case "passes":
              var statValue = hPlayersStats[index].assists;
              break;
            case "contres":
              var statValue = hPlayersStats[index].blocks;
              break;
          }
        }
      }
      for (let index = 0; index < aPlayersStats.length; index++) {
        if (selectedPlayer == aPlayersStats[index].name) {
          foundId = aPlayersStats[index].id;
          switch (stat) {
            case "points":
              var statValue = aPlayersStats[index].points;
              break;
            case "rebonds":
              var statValue = aPlayersStats[index].rebounds;
              break;
            case "passes":
              var statValue = aPlayersStats[index].assists;
              break;
            case "contres":
              var statValue = aPlayersStats[index].blocks;
              break;
          }
        }
      }
    }
    document.getElementById("graph").scrollIntoView();
    setGraphParam([foundId, stat]);
    
    setFormParam([foundId, selectedPlayer, stat, statValue]);
    setSearchTerm("");
  }

  function getStat(stat) {
    setShowStat(stat);
    getPlayerGraph(player, stat);
  }

  function getGraph(id, name, stat, statValue) {
    document.getElementById("graph").scrollIntoView();
    setPlayer(name);
    setShowStat(stat);
    setGraphParam([id, stat]);
    setFormParam([id, name, stat, statValue]);
  }

  function orderBy(array, key) {
    return array.slice().sort((a, b) => {
      if (a[key] < b[key]) {
        return -1;
      }
      if (a[key] > b[key]) {
        return 1;
      }
      return 0;
    });
  }

  function sort(param) {
    if (sortBy[0] == param && sortBy[1] == 0) {
      setSortBy([param, 1]);
    } else {
      setSortBy([param, 0]);
    }
  }

  function showStats(PlayersStats) {
    let logoUrl =
      "https://cdn.nba.com/logos/nba/" +
      PlayersStats[0].teamId +
      "/global/L/logo.svg";
    if(homeIsLoading==false){
      return (
        <table
          id="tb1"
          className="col-md-10 m-auto table table-hover table-dark "
        >
          <thead>
            <tr>
              <th scope="col">
                <img style={{ maxHeight: "80px" }} src={logoUrl} />
              </th>
              <th scope="col"> </th>
              <th scope="col" onClick={() => sort("games")}>
                {" "}
                Matchs <i className="fa fa-solid fa-sort text-white" />
              </th>
              <th scope="col" onClick={() => sort("minutes")}>
                {" "}
                Minutes <i className="fa fa-solid fa-sort text-white" />
              </th>
              <th scope="col" onClick={() => sort("points")}>
                Points <i className="fa fa-solid fa-sort text-white" />
              </th>
              <th scope="col" onClick={() => sort("rebounds")}>
                Rebonds <i className="fa fa-solid fa-sort text-white" />
              </th>
              <th scope="col" onClick={() => sort("assists")}>
                {" "}
                Passes <i className="fa fa-solid fa-sort text-white" />
              </th>
              <th scope="col" onClick={() => sort("blocks")}>
                {" "}
                Contres <i className="fa fa-solid fa-sort text-white" />
              </th>
              <th scope="col" onClick={() => sort("steals")}>
                {" "}
                Inters <i className="fa fa-solid fa-sort text-white" />
              </th>
              <th scope="col" onClick={() => sort("three_fg_pct")}>
                {" "}
                %3 Pts <i className="fa fa-solid fa-sort text-white" />
              </th>
              <th scope="col" onClick={() => sort("fg_pct")}>
                {" "}
                %Tir <i className="fa fa-solid fa-sort text-white" />
              </th>
              <th scope="col" onClick={() => sort("plusminus")}>
                {" "}
                +/- <i className="fa fa-solid fa-sort text-white" />
              </th>
            </tr>
          </thead>
          <tbody>
            {PlayersStats[0] !== undefined
              ? PlayersStats.slice(0, 10).map((player) => (
                  <tr key={player.id}>
                    <td>
                      <img
                        style={{ maxHeight: "50px" }}
                        src={
                          "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/1040x760/" +
                          player.id +
                          ".png"
                        }
                      ></img>
                    </td>
                    <td className="align-middle text-center"> {player.name}</td>
                    <td className="align-middle text-center">{player.games} </td>
                    <td className="align-middle text-center">
                      <button
                        className="btn btn-black statButton"
                        onClick={() =>
                          getGraph(
                            player.id,
                            player.name,
                            "minutes",
                            player.minutes
                          )
                        }
                      >
                        {player.minutes}
                      </button>
                    </td>
                    <td className="align-middle text-center">
                      <button
                        className="btn btn-black statButton"
                        onClick={() =>
                          getGraph(
                            player.id,
                            player.name,
                            "points",
                            player.points
                          )
                        }
                      >
                        {player.points}
                      </button>
                    </td>
                    <td className="align-middle text-center">
                      <button
                        className="btn btn-black statButton"
                        onClick={() =>
                          getGraph(
                            player.id,
                            player.name,
                            "rebonds",
                            player.rebounds
                          )
                        }
                      >
                        {player.rebounds}{" "}
                      </button>
                    </td>
                    <td className="align-middle text-center">
                      <button
                        className="btn btn-black statButton"
                        onClick={() =>
                          getGraph(
                            player.id,
                            player.name,
                            "passes",
                            player.assists
                          )
                        }
                      >
                        {player.assists}
                      </button>
                    </td>
                    <td className="align-middle text-center">
                      <button
                        className="btn btn-black statButton"
                        onClick={() =>
                          getGraph(
                            player.id,
                            player.name,
                            "contres",
                            player.blocks
                          )
                        }
                      >
                        {player.blocks}
                      </button>
                    </td>
                    <td className="align-middle text-center">
                      <button
                        className="btn btn-black statButton"
                        onClick={() =>
                          getGraph(
                            player.id,
                            player.name,
                            "interceptions",
                            player.steals
                          )
                        }
                      >
                        {player.steals}
                      </button>
                    </td>
                    <td className="align-middle text-center">
                      <button
                        className="btn btn-black statButton"
                        onClick={() =>
                          getGraph(
                            player.id,
                            player.name,
                            "3pt_pct",
                            player.three_fg_pct
                          )
                        }
                      >
                        {player.three_fg_pct}
                      </button>
                    </td>
                    <td className="align-middle text-center">
                      <button
                        className="btn btn-black statButton"
                        onClick={() =>
                          getGraph(
                            player.id,
                            player.name,
                            "fg_pct",
                            player.fg_pct
                          )
                        }
                      >
                        {player.fg_pct}
                      </button>
                    </td>
                    <td className="align-middle text-center">
                      <button
                        className="btn btn-black statButton"
                        onClick={() =>
                          getGraph(
                            player.id,
                            player.name,
                            "+/-",
                            player.plusminus
                          )
                        }
                      >
                        {player.plusminus}
                      </button>
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      ); }
    else
    {
      return (
        <table
          id="tbloading"
          className="col-md-10 m-auto table table-hover table-dark p-3 d-flex justify-content-center"
        >< i class="text-white fa fa-spinner fa-spin" style={{fontSize:"2rem"}}></i> 
        </table>
      )
    }
  }
  return (
    <div className="playersStats" style={{ margin: "auto" }}>
      <div id="graph" className="pt-3 pb-3" style={{display: props.subMenuItem == 1 || props.subMenuItem==3?  "block" :  "none"}}>
      
      <h3 className="text-center text-white m-3" style={{display: props.subMenuItem == 1 ?  "block" :  "none"}}>
              Miser sur les stats d'un joueurs
            </h3>
        {" "}
        <div className="m-3 bg-dark p-4" style={{borderRadius:"4rem"}}>
          <input
            type="text"
            placeholder="Recherchez un nom de joueur"
            value={searchTerm}
            onChange={handleSearch}
            className="p-2 text-white text-center m-2"
          />
          <div id="playerList">
            {searchResults.map((player, index) => (
              <div
                key={index}
                className="bg-dark text-white text-center"
                onClick={() => handleSelect(player)}
              >
                {player}
              </div>
            ))}
          </div>
        
        {graphParam[0] !== 0 &&
          <div>
            <select
              className="custom-select p-2 text-white text-center"
              name="showStat"
              value={showStat}
              id="showStatSelect"
              onChange={(e) => getStat(e.target.value)}
            >
              <option
                value="points"
                style={{
                  color: "black",
                  backgroundColor: "white",
                  textAlign: "center",
                }}
              >
                Points
              </option>
              <option
                value="rebonds"
                style={{
                  color: "black",
                  backgroundColor: "white",
                  textAlign: "center",
                }}
              >
                Rebonds
              </option>
              <option
                value="passes"
                style={{
                  color: "black",
                  backgroundColor: "white",
                  textAlign: "center",
                }}
              >
                Passes Decisives
              </option>
              <option
                value="contres"
                style={{
                  color: "black",
                  backgroundColor: "white",
                  textAlign: "center",
                }}
              >
                Contres
              </option>
            </select>
          </div>}
          {graphParam[0] !== 0 &&
            props.subMenuItem==1  && <BetStatForm
              id={formParam[0]}
              name={formParam[1]}
              stat={formParam[2]}
              statValue={formParam[3]}
              registered={props.registered}
              user={props.user}
              it={props.it}
              setIt={props.setIt}
              gameId={props.gameId}
              startTime={props.startTime}
              startDate={props.startDate}
            />}
           {graphParam[0] !== 0 &&
           ( props.subMenuItem==3)  && <StatGraph graphParam={graphParam} setGraphParam={setGraphParam} />}
         
        </div>
      </div>
      {hPlayersStats[0] !== undefined && props.subMenuItem == 3 && 
        showStats(hPlayersStats)}
       {hPlayersStats[0] !== undefined && props.subMenuItem == 3 && (
       <p class="alert-info p-3 mt-4" style={{borderRadius:"1rem"}}>Clique sur une stat pour voir son évolution</p>)}
      {aPlayersStats[0] !== undefined && props.subMenuItem == 3 && 
        showStats(aPlayersStats)}
      <br />
    </div>
  );
}

export default PlayersStats;
