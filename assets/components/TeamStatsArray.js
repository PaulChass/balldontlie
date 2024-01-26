import React from "react";
import { useState, useEffect } from "react";
import "../styles/TeamsStatsArray.css";
import TeamsStatsButtonBar from "./TeamsStatsButtonBar";
import Injuries from "./Injuries";
import Simulation from "./Simulation";
import PlayersStats from "./PlayersStats";

function TeamsStatsArrays(props) {
  const [lastNgames, setLastNGames] = useState("0");
  const [homeOrAway, setHomeOrAway] = useState("all");
  const [winLose, setWinLose] = useState("all");
  const [vsMatchup, setVsMatchup] = useState("0");
  const [paceAdjust, setPaceAdjust] = useState("N");
  const [seasonType, setSeasonType] = useState("Regular+Season");
  const [measureType, setMeasureType] = useState("Base");

  const [bets, setBets] = useState([]);
  const [betAmount, setBetAmount] = useState(10);
  const [simulated, setSimulated] = useState(0);
  const [home, setHome] = useState(0);
  const [day, setDay] = useState(0);
  const [odd, setOdd] = useState(1);

  const [homeLogo, setHomeLogo] = useState("");
  const [hteam, setHteam] = useState("");
  const [hTeamPoints, setHTeamPoints] = useState("");
  const [hPointsTaken, setHPointsTaken] = useState("");

  const [hWon, setHWon] = useState("");
  const [hLost, setHLost] = useState("");
  const [hReb, setHReb] = useState("");
  const [hBlk, setHBlk] = useState("");
  const [hAss, setHAss] = useState("");
  const [hStl, setHStl] = useState("");
  const [hTo, setHTo] = useState("");
  const [h3pct, setH3pct] = useState("");
  const [h2pct, setH2pct] = useState("");
  const [h3ptAtt, setH3ptAtt] = useState("");
  const [hDefRat, setHDefRat] = useState("");
  const [hOPP_PTS_OFF_TOV , setHOPP_PTS_OFF_TOV] = useState("");
  const [hOPP_PTS_2ND_CHANCE, setHOPP_PTS_2ND_CHANCE] = useState("");
  const [hOPP_PTS_FB, setHOPP_PTS_FB] = useState("");
  const [hOPP_PTS_PAINT, setHOPP_PTS_PAINT] = useState("");
  const [hOffRat,setHOffRat] = useState("");
  const [hNetRat,setHNetRat] = useState("");
  const [hPace, setHPace] = useState("");
  const [hTS_PCT, setHTS_PCT] = useState("");
  const [hAST_PCT, setHAST_PCT] = useState("");
  const [hAST_TO, setHAST_TO] = useState("");
  const [hOREB_PCT, setHOREB_PCT] = useState("");
  const [hDREB_PCT, setHDREB_PCT] = useState("");





  const [awayLogo, setAwayLogo] = useState("");
  const [ateam, setAteam] = useState("");
  const [aTeamPoints, setATeamPoints] = useState("");
  const [aPointsTaken, setAPointsTaken] = useState("");

  const [aWon, setAWon] = useState("");
  const [aLost, setALost] = useState("");
  const [aReb, setAReb] = useState("");
  const [aBlk, setABlk] = useState("");
  const [aAss, setAAss] = useState("");
  const [aStl, setAStl] = useState("");
  const [aTo, setATo] = useState("");
  const [a3pct, setA3pct] = useState("");
  const [a2pct, setA2pct] = useState("");
  const [a3ptAtt, setA3ptAtt] = useState("");
  const [aDefRat, setADefRat] = useState("");
  const [aOPP_PTS_OFF_TOV , setAOPP_PTS_OFF_TOV] = useState("");
  const [aOPP_PTS_2ND_CHANCE, setAOPP_PTS_2ND_CHANCE] = useState("");
  const [aOPP_PTS_FB, setAOPP_PTS_FB] = useState("");
  const [aOPP_PTS_PAINT, setAOPP_PTS_PAINT] = useState("");
  const [aOffRat,setAOffRat] = useState("");
  const [aNetRat,setANetRat] = useState("");
  const [aPace, setAPace] = useState("");
  const [aTS_PCT, setATS_PCT] = useState("");
  const [aAST_PCT, setAAST_PCT] = useState("");
  const [aAST_TO, setAAST_TO] = useState("");
  const [aOREB_PCT, setAOREB_PCT] = useState("");
  const [aDREB_PCT, setADREB_PCT] = useState("");



  const [subMenuItem, setSubMenuItem] = useState(0);

  var homeTeam = props.hTeamName;
  var awayTeam = props.aTeamName;
  var homeName = homeTeam.split(" ");
  var awayName = awayTeam.split(" ");
  var game = awayTeam + "@" + homeTeam;
  var gameId = props.gameId;

  useEffect(() => {
    props.setIt(props.it + 1);
    const exceptions = [
      "Angeles",
      "Antonio",
      "Trail",
      "State",
      "Orleans",
      "York",
      "City",
    ];
    if (exceptions.includes(homeName[1])) {
      homeName[1] = homeName[2];
    }
    if (exceptions.includes(awayName[1])) {
      awayName[1] = awayName[2];
    }
    if (homeName[1] == "Blazers") {
      homeName[1] = "TBlazers";
    }
    if (homeName[1] == "Timberwolves") {
      homeName[1] = "TWolves";
    }
    if (awayName[1] == "Blazers") {
      awayName[1] = "TBlazers";
    }
    if (awayName[1] == "Timberwolves") {
      awayName[1] = "TWolves";
    }

    const url =
      "https://balldontlie.fr/index.php/simulation/" +
      homeName[1] +
      "/" +
      awayName[1];
    const simulate = fetch(url)
      .then((response) => response.json())
      .then((data) => {
        return data;
      });

    simulate.then((d) => {
      setSimulated(d.data);
      if (home == 0) {
        let o = parseInt(d.data.hOdds * 100) / 100;
        setOdd(o);
      } else {
        let o = parseInt(d.data.aOdds * 100) / 100;
        setOdd(o);
      }
    });
  }, [homeTeam, awayTeam, home]);

  function bet(home) {
    if (props.registered == "Registration successful") {
      props.setIt(props.it + 1);
      // Send the registration data to your Symfony backend API

      fetch("index.php/bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          team: home,
          odd: odd,
          user: props.user,
          game: game,
          gameId: props.gameId,
          betAmount: betAmount,
          startTime: props.startTime,
          startDate: props.startDate,
        }),
      })
        .then((response) => {
          if (response.status === 200) {
            props.setIt(props.it + 1);
            alert("pari enregistré");
          } else {
            // Handle registration errors, e.g., display error messages
          }
        })
        .catch((error) => {
          // Handle network or other errors
        });
    } else {
      alert("Vous devez être connecté pour proposer ce pari");
    }
  }

  function showBets(game) {
    ///All bets but user bets for this game
    useEffect(() => {
      let url = "/index.php/fetch-bets/" + game;
      fetch(url) // Replace with the correct API endpoint URL
        .then((response) => response.json())
        .then((data) => setBets(data))
        .catch((error) => console.error("Error fetching data:", error));
    }, [props.it, props.hTeamName, props.gameId]);

    if (typeof bets[0] != "undefined") {
      for (let index = 0; index < bets.length; index++) {
        if (bets[index].Username == props.user) {
          bets.splice(index, 1);
          index = index - 1;
        }
      }
    }

    var date = new Date();
    var d = day;
    if (d < 10) {
      d = "0" + d;
    }
    for (let i = 0; i < bets.length; i++) {
      if (
        bets[i].startTime ==
        date.getFullYear + "-" + date.getMonth() + "-" + d
      ) {
        bets.splice(i, 1);
        i = i - 1;
      }
    }

    if (typeof bets[0] != "undefined") {
      return (
        <div>
          <span>{props.user !== "" && getBalance(props.user)}</span>
          {
            <h2 className="text-center text-white m-3">
              <span>Paris disponible pour ce match </span> :{" "}
            </h2>
          }
          <div className="gameBets">
            {typeof bets[0] !== "undefined" &&
              bets.slice(0, 10).map((bet) => (
                <div
                  key={bet.id}
                  className="gameBetAvailable mr-auto ml-auto card bg-dark text-white mb-4 col-md-8"
                  style={{ borderRadius: "2rem" }}
                >
                  <div className="card-header d-flex justify-content-between">
                    <h5 className="card-title gameName">{bet.Game}</h5>
                    <span className="text-right font-weight-light font-italic">
                      proposé par {bet.username}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="gameInfo  d-flex justify-content-between">
                      <p className="card-text teamName">
                        {bet.HomeorAway === 1 &&
                          bet.type == null &&
                          "Vainqueur: " +
                            bet.Game.substring(bet.Game.indexOf("@") + 1)}

                        {bet.HomeorAway === 0 &&
                          bet.type == null &&
                          "Vainqueur: " +
                            bet.Game.substring(0, bet.Game.indexOf("@"))}

                        {bet.type != null &&
                          bet.HomeorAway === 0 &&
                          "Moins de " + bet.typeValue + " " + bet.type}
                        {bet.type != null &&
                          bet.HomeorAway === 1 &&
                          Number.isInteger(parseFloat(bet.typeValue)) == true &&
                          "Plus de " +
                            (parseInt(bet.typeValue) - 0.5) +
                            " " +
                            bet.type}
                        {bet.type != null &&
                          bet.HomeorAway === 1 &&
                          Number.isInteger(parseFloat(bet.typeValue)) ==
                            false &&
                          "Plus de " + bet.typeValue + " " + bet.type}
                      </p>
                      {bet.type != null && (
                        <img
                          src={
                            "https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/1040x760/" +
                            bet.playerId +
                            ".png"
                          }
                          style={{ height: "3rem" }}
                        />
                      )}
                      {bet.HomeorAway === 0 && bet.type == null && (
                        <img src={bet.aLogo} style={{ height: "3rem" }} />
                      )}
                      {bet.HomeorAway === 1 && bet.type == null && (
                        <img src={bet.hLogo} style={{ height: "3rem" }} />
                      )}
                    </div>
                    <div className="betDetails mb-2">
                      <p className="card-text mise">
                        Mise: {(bet.Amount * bet.Odd - bet.Amount).toFixed(2)} €
                      </p>
                      <p className="card-text cote">
                        Cote: {(1 / (1 - 1 / bet.Odd)).toFixed(2)}
                      </p>
                    </div>
                    <div className="betDetails mb-3">
                      <p className="card-text gains">
                        Gains:{" "}
                        {(
                          (1 / (1 - 1 / bet.Odd)) *
                          (bet.Amount * bet.Odd - bet.Amount)
                        ).toFixed(2)}{" "}
                        €
                      </p>
                      <p className="card-text timeRemaining">
                        Temps restant: <span id={"atimeToBet" + bet.id}></span>
                      </p>
                    </div>
                    <button
                      className="btn btn-primary  btn-lg btn-block"
                      onClick={() =>
                        acceptBet(
                          bet.id,
                          bet.startTime,
                          bet.startDate,
                          bet.type,
                          bet.typeValue
                        )
                      }
                    >
                      Parier
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      );
    }
    //  else {return(<div> Aucun pari dispo pour ce match</div>)}
  }

  function getBalance(user) {
    let url = "/index.php/balance/" + user;
    fetch(url) // Replace with the correct API endpoint URL
      .then((response) => response.json())
      .then((data) => props.setBalance(data))
      .catch((error) => console.error("Error fetching data:", error));
  }

  function acceptBet(id, startTime, startDate, type, typeValue) {
    if (props.registered == "Registration successful") {
      // Send the registration data to your Symfony backend API
      fetch("index.php/acceptBet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: props.user,
          id: id,
          startTime: startTime,
          startDate: startDate,
          type: type,
          typeValue: typeValue,
        }),
      })
        .then((response) => {
          if (response.status === 200) {
            setItb(itb + 1);
            alert("pari accepté");
          } else {
            alert("pari accepté");
          }
        })
        .catch((error) => {
          // Handle network or other errors
        });
    } else {
      alert("Vous devez être connecté pour accepter ce pari");
    }
  }

  function timeToBet() {
    var clockTime = new Date().toLocaleTimeString();
    var clockTimes = clockTime.split(":");
    var el = 0;
    var elementId = 0;
    if (bets.length !== 0) {
      for (let index = 0; index < bets.length; index++) {
        var startTime = bets[index]["startTime"];
        var startTimes = startTime.split(":");
        startTimes[0] = parseInt(startTimes[0]);
        startTimes[1] = parseInt(startTimes[1]);
        if (startTimes[0] < 6) {
          startTimes[0] = startTimes[0] + 24;
        }

        var h = startTimes[0] - parseInt(clockTimes[0]);
        var m = startTimes[1] - parseInt(clockTimes[1]);

        var s = 60 - parseInt(clockTimes[2]);
        if (s != 60) {
          m = m - 1;
        } else {
          s = 0;
        }
        if (m < 0) {
          m = 60 + m;
          h = h - 1;
        }
        if (h >= 24) {
          h = h - 24;
        }
        elementId = "btimeToBet" + bets[index]["id"];
        el = document.getElementById(elementId);
        if (el !== null) {
          el.innerHTML = h + "h" + m + "m" + s + "s";
        }
      }
    }
  }

  setInterval(timeToBet, 1000);

  useEffect(() => {
    if (typeof props.teams !== "undefined" && props.teams[0] !== 0) {
      var homeUrl =
        "https://balldontlie.fr/index.php/stats/" +
        props.teams[0] +
        "/" +
        lastNgames +
        "/" +
        homeOrAway +
        "/" +
        winLose +
        "/" +
        vsMatchup +
        "/" +
        paceAdjust +
        "/" +
        seasonType +
        "/" +
        measureType;
      var awayUrl =
        "https://balldontlie.fr/index.php/stats/" +
        props.teams[1] +
        "/" +
        lastNgames +
        "/" +
        homeOrAway +
        "/" +
        winLose +
        "/" +
        vsMatchup +
        "/" +
        paceAdjust +
        "/" +
        seasonType +
        "/" +
        measureType;

      const hteamStats = fetch(homeUrl) //1
        .then((response) => response.json()) //2
        .then((team) => {
          return team; //3
        });

      const ateamStats = fetch(awayUrl) //1
        .then((response) => response.json()) //2
        .then((team) => {
          return team; //3
        });

      const getTeamsStats = () => {
        hteamStats.then((h) => {
          if(measureType=='Base'){
          setHTeamPoints(h.data.points);
          setHPointsTaken(h.data.pointsTaken);
          setHteam(h.data.Team);
          setHomeLogo(
            <img
              className="logo"
              src={`https://cdn.nba.com/logos/nba/${h.data.team_id}/global/L/logo.svg`}
              alt="team logo"
            />
          );
          setHWon(h.data.wins);
          setHLost(h.data.losses);
          setHReb(h.data.rebounds);
          setHBlk(h.data.blocks);
          setHAss(h.data.assists);
          setHStl(h.data.steals);
          setHTo(h.data.turnovers);
          setH3pct(h.data.three_fg_pct);
          setH2pct(h.data.fg_pct);
          setH3ptAtt(h.data.three_attempts);
          props.setHTeamName(h.data.Team);
          }
          else{
            setHteam(h.data.Team);
            setHomeLogo(
              <img
                className="logo"
                src={`https://cdn.nba.com/logos/nba/${h.data.team_id}/global/L/logo.svg`}
                alt="team logo"
              />
            );
            setHDefRat(h.data.def_rating);
            setHOPP_PTS_2ND_CHANCE(h.data.OPP_PTS_2ND_CHANCE);
            setHOPP_PTS_PAINT(h.data.OPP_PTS_PAINT);
            setHOPP_PTS_FB(h.data.OPP_PTS_FB);
            setHOPP_PTS_OFF_TOV(h.data.OPP_PTS_OFF_TOV);
            setHOffRat(h.data.OFF_RATING);
            setHNetRat(h.data.NET_RATING);
            setHPace(h.data.PACE);
            setHTS_PCT(h.data.TS_PCT);
            setHAST_PCT(h.data.AST_PCT);
            setHAST_TO(h.data.AST_TO);
            setHOREB_PCT(h.data.OREB_PCT);
            setHDREB_PCT(h.data.DREB_PCT);
            props.setHTeamName(h.data.Team);
          }
        });

        ateamStats.then((a) => {
          if(measureType=='Base'){
          setATeamPoints(a.data.points);
          setAPointsTaken(a.data.pointsTaken);
          setAteam(a.data.Team);
          setAwayLogo(
            <img
              className="logo"
              src={`https://cdn.nba.com/logos/nba/${a.data.team_id}/global/L/logo.svg`}
              alt="team logo"
            />
          );
          setAWon(a.data.wins);
          setALost(a.data.losses);
          setAReb(a.data.rebounds);
          setABlk(a.data.blocks);
          setAAss(a.data.assists);
          setAStl(a.data.steals);
          setATo(a.data.turnovers);
          setA3pct(a.data.three_fg_pct);
          setA2pct(a.data.fg_pct);
          setA3ptAtt(a.data.three_attempts);
          props.setATeamName(a.data.Team);
          }
          else{
            setAteam(a.data.Team);
            setAwayLogo(
              <img
                className="logo"
                src={`https://cdn.nba.com/logos/nba/${a.data.team_id}/global/L/logo.svg`}
                alt="team logo"
              />
            );
            setADefRat(a.data.def_rating);
            setAOPP_PTS_2ND_CHANCE(a.data.OPP_PTS_2ND_CHANCE);
            setAOPP_PTS_FB(a.data.OPP_PTS_FB);
            setAOPP_PTS_PAINT(a.data.OPP_PTS_PAINT)
            setAOPP_PTS_OFF_TOV(a.data.OPP_PTS_OFF_TOV);
            setAOffRat(a.data.OFF_RATING);
            setANetRat(a.data.NET_RATING);
            setAPace(a.data.PACE);
            setATS_PCT(a.data.TS_PCT);
            setAAST_PCT(a.data.AST_PCT);
            setAAST_TO(a.data.AST_TO);
            setAOREB_PCT(a.data.OREB_PCT);
            setADREB_PCT(a.data.DREB_PCT);
            props.setATeamName(a.data.Team);
          }
        });
      };
      getTeamsStats();
    }
  }, [
    props.teams,
    lastNgames,
    homeOrAway,
    winLose,
    paceAdjust,
    vsMatchup,
    seasonType,
    measureType,
  ]);

  return (
    <div>
      <h2 className="text-center text-white m-3">
        {props.aTeamName}@{props.hTeamName}
      </h2>

      <div className="m-3">
        <div
          className="btn-group justify-content-around col-12 mr-auto ml-auto mb-2 mt-4"
          style={{ opacity: 0.8 }}
          role="group"
        >
          <button
            type="button"
            className={`btn ${
              subMenuItem === 0 ? "btn-dark p-2 m-1 active" : "btn-dark p-2 m-1"
            }`}
            style={{ borderRadius: "1rem" }}
            onClick={() => setSubMenuItem(0)}
          >
            Stats Equipes
          </button>
          <button
            type="button"
            className={`btn ${
              subMenuItem === 3 ? "btn-dark p-2 m-1 active" : "btn-dark p-2 m-1"
            }`}
            style={{ borderRadius: "1rem" }}
            onClick={() => setSubMenuItem(3)}
          >
            Stats Joueurs
          </button>
          <button
            type="button"
            className={`btn ${
              subMenuItem === 2 ? "btn-dark p-2 m-1 active" : "btn-dark p-2 m-1"
            }`}
            style={{ borderRadius: "1rem" }}
            onClick={() => setSubMenuItem(2)}
          >
            Injury report
          </button>
          <button
            type="button"
            className={`btn ${
              subMenuItem === 1 ? "btn-dark p-2 m-1 active" : "btn-dark p-2 m-1"
            }`}
            style={{ borderRadius: "1rem" }}
            onClick={() => setSubMenuItem(1)}
          >
            Parier sur ce match
          </button>
        </div>

        <div style={{ display: subMenuItem == 1 ? "block" : "none" }}>
          <h3 className="text-center text-white m-3">Miser sur le vainqueur</h3>
          <p className="text-center text-white">
            {" "}
            (remboursé si aucun preneur)
          </p>

          <table
            className="col-lg-10  table table-hover table-dark bg-dark text-white large"
            style={{ borderRadius: "4rem", margin: "auto" }}
          >
            <tbody>
              <tr>
                <td style={{ padding: "2rem" }}>
                  Miser{" "}
                  <input
                    type="number"
                    min="0"
                    max="20"
                    className="form-control p-2 text-white text-center"
                    onChange={(e) => setBetAmount(e.target.value)}
                    value={betAmount}
                  />{" "}
                </td>
                <td>
                  {" "}
                  sur les
                  <select
                    className="custom-select p-2 text-white text-center"
                    name="home"
                    id="homeSelect"
                    onChange={(e) => setHome(e.target.value)}
                    style={{ fontSize: "1rem" }}
                  >
                    <option
                      value="0"
                      style={{
                        color: "black",
                        backgroundColor: "white",
                        textAlign: "center",
                      }}
                    >
                      {homeTeam}
                    </option>
                    <option
                      value="1"
                      style={{
                        color: "black",
                        backgroundColor: "white",
                        textAlign: "center",
                      }}
                    >
                      {awayTeam}{" "}
                    </option>
                  </select>
                </td>
                <td>
                  Cote :
                  <input
                    type="number"
                    min="0"
                    max="20"
                    className="form-control p-2 text-white text-center"
                    onChange={(e) => setOdd(e.target.value)}
                    value={odd}
                  />
                </td>
                <td>
                  Gains :<p className="large">{(odd * betAmount).toFixed(2)}</p>
                </td>
                <td>
                  <button
                    className="btn btn-primary w-50 "
                    onClick={() => bet(home)}
                  >
                    Miser{" "}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: subMenuItem == 0 ? "block" : "none" }}>
        <h3 className="text-white text-center m-3">Comparaison des équipes</h3>
        <div
          className="btn-group justify-content-around col-12 mr-auto ml-auto mb-2 mt-4"
          style={{ opacity: 0.8 }}
          role="group"
        >
          <button
            type="button"
            className={`btn ${
              measureType === "Base"
                ? "btn-dark p-2 m-1 active"
                : "btn-dark p-2 m-1"
            }`}
            style={{ borderRadius: "1rem" }}
            onClick={() => setMeasureType("Base")}
          >
            Stats General
          </button>
          
          <button
            type="button"
            className={`btn ${
              measureType == "Advanced"
                ? "btn-dark p-2 m-1 active"
                : "btn-dark p-2 m-1"
            }`}
            style={{ borderRadius: "1rem" }}
            onClick={() => setMeasureType("Advanced")}
          >
            Stats Avancees
          </button>
        </div>
        <div id="" className="teamStats d-flex center text-center">
        {measureType === "Base" ?  
        (<table id="" className="table table-hover table-dark">
            <thead>
              <tr>
                <th scope="col" className="left">
                  Stats des équipes{" "}
                </th>
                <th id="homeLogo" scope="col">
                  {homeLogo}
                </th>
                <th id="awayLogo" scope="col">
                  {awayLogo}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className="left">
                  Bilan
                </th>
                <td>
                  <span id="hWon" className="text-success">
                    {hWon}
                  </span>
                  /
                  <span id="hLost" className="text-danger">
                    {hLost}
                  </span>
                </td>
                <td>
                  <span id="aWon" className="text-success">
                    {aWon}
                  </span>
                  /
                  <span id="aLost" className="text-danger">
                    {aLost}
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row" className="left">
                  Points
                </th>
                <td style={{ color: "white" }} id="hTeamPoints">
                  {hTeamPoints}
                </td>
                <td style={{ color: "white" }} id="aTeamPoints">
                  {aTeamPoints}
                </td>
              </tr>
              <tr>
                <th scope="row" className="left">
                  Points encaissés
                </th>
                <td style={{ color: "white" }} id="hPointsTaken">
                  {parseFloat(hPointsTaken).toFixed(1)}
                </td>
                <td style={{ color: "white" }} id="aPointsTaken">
                  {parseFloat(aPointsTaken).toFixed(1)}
                </td>
              </tr>
              <tr>
                <th scope="row" className="left">
                  Rebonds
                </th>
                <td style={{ color: "white" }} id="hReb">
                  {hReb}
                </td>
                <td style={{ color: "white" }} id="aReb">
                  {aReb}
                </td>
              </tr>
              <tr>
                <th scope="row" className="left">
                  Passes
                </th>
                <td style={{ color: "white" }} id="hAss">
                  {hAss}
                </td>
                <td style={{ color: "white" }} id="aAss">
                  {aAss}
                </td>
              </tr>
              <tr>
                <th scope="row" className="left">
                  Contres
                </th>
                <td style={{ color: "white" }} id="hBlk">
                  {hBlk}
                </td>
                <td style={{ color: "white" }} id="aBlk">
                  {aBlk}
                </td>
              </tr>

              <tr>
                <th scope="row" className="left">
                  Interceptions
                </th>
                <td style={{ color: "white" }} id="hStl">
                  {hStl}
                </td>
                <td style={{ color: "white" }} id="aStl">
                  {aBlk}
                </td>
              </tr>
              <tr>
                <th scope="row" className="left">
                  Pertes de balle
                </th>
                <td style={{ color: "white" }} id="hTo">
                  {hTo}
                </td>
                <td style={{ color: "white" }} id="aTo">
                  {aTo}
                </td>
              </tr>
              <tr>
                <th scope="row" className="left">
                  {" "}
                  3pts tentés
                </th>
                <td style={{ color: "white" }} id="h3ptAtt">
                  {h3ptAtt}
                </td>
                <td style={{ color: "white" }} id="a3ptAtt">
                  {a3ptAtt}
                </td>
              </tr>
              <tr>
                <th scope="row" className="left">
                  % 3pts
                </th>
                <td style={{ color: "white" }} id="h3pct">
                  {h3pct}
                </td>
                <td style={{ color: "white" }} id="a3pct">
                  {a3pct}
                </td>
              </tr>
              <tr>
                <th scope="row" className="left">
                  % Total
                </th>
                <td style={{ color: "white" }} id="h2pct">
                  {h2pct}
                </td>
                <td style={{ color: "white" }} id="a2pct">
                  {a2pct}
                </td>
              </tr>
            </tbody>
          </table>):(<table id="" className="table table-hover table-dark">
            <thead>
              <tr>
                <th scope="col" className="left">
                  {" "}
                </th>
                <th id="homeLogo" scope="col">
                  {homeLogo}
                </th>
                <th id="awayLogo" scope="col">
                  {awayLogo}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
              <th scope="row" className="left">
                  Rating Defensif
                </th>
                <td style={{ color: "white" }} id="hDefRating">
                  {hDefRat}
                </td>
                <td style={{ color: "white" }} id="aDefRat">
                  {aDefRat}
                </td>
              </tr>
              <tr>
              <th scope="row" className="left">
                  Rating Offensif
                </th>
                <td style={{ color: "white" }} id="hOffRat">
                  {hOffRat}
                </td>
                <td style={{ color: "white" }} id="aOffRat">
                  {aOffRat}
                </td>
              </tr>
              <tr>
              <th scope="row" className="left">
                  Net Rating
                </th>
                <td style={{ color: "white" }} id="hNetRat">
                  {hNetRat}
                </td>
                <td style={{ color: "white" }} id="aNetRat">
                  {aNetRat}
                </td>
              </tr>
            
             
              <tr>
              <th scope="row" className="left">
                  PACE 
                </th>
                <td style={{ color: "white" }} id="hPace">
                  {hPace}
                </td>
                <td style={{ color: "white" }} id="aPace">
                  {aPace}
                </td>
              </tr>
              <tr>
              <th scope="row" className="left">
                  True Shooting %
                </th>
                <td style={{ color: "white" }} id="hTS_PCT">
                  {hTS_PCT}
                </td>
                <td style={{ color: "white" }} id="aTS_PCT">
                  {aTS_PCT}
                </td>
              </tr>
              <tr>
              <th scope="row" className="left">
                   % Rebonds offensifs 
                </th>
                <td style={{ color: "white" }} id="hOREB_PCT">
                  {hOREB_PCT}
                </td>
                <td style={{ color: "white" }} id="aOREB_PCT">
                  {aOREB_PCT}
                </td>
              </tr>
              <tr>
              <th scope="row" className="left">
                 %  Rebonds defensifs 
                </th>
                <td style={{ color: "white" }} id="hDREB_PCT">
                  {hDREB_PCT}
                </td>
                <td style={{ color: "white" }} id="aDREB_PCT">
                  {aDREB_PCT}
                </td>
              </tr>
              <tr>
              <th scope="row" className="left">
                  % passes decisives
                </th>
                <td style={{ color: "white" }} id="hAST_PCT">
                  {hAST_PCT}
                </td>
                <td style={{ color: "white" }} id="aAST_PCT">
                  {aAST_PCT}
                </td>
              </tr>
              <tr>
              <th scope="row" className="left">
                  Ratio Passes pour pdb
                </th>
                <td style={{ color: "white" }} id="hAST_TO">
                  {hAST_TO}
                </td>
                <td style={{ color: "white" }} id="aAST_TO">
                  {aAST_TO}
                </td>
              </tr>


              
              
              <tr>
              <th scope="row" className="left">
                  Points pris : - sur rebonds offensifs
                </th>
                <td style={{ color: "white" }} id="hOPP_PTS_2ND_CHANCE">
                  {hOPP_PTS_2ND_CHANCE}
                </td>
                <td style={{ color: "white" }} id="aOPP_PTS_2ND_CHANCE">
                  {aOPP_PTS_2ND_CHANCE}
                </td>
              </tr>
              <tr>
              <th scope="row" className="left">
                  - sur perte de balle
                </th>
                <td style={{ color: "white" }} id="hOPP_PTS_OFF_TOV">
                  {hOPP_PTS_OFF_TOV}
                </td>
                <td style={{ color: "white" }} id="aOPP_PTS_OFF_TOV">
                  {aOPP_PTS_OFF_TOV}
                </td>
              </tr>
              <tr>
              <th scope="row" className="left">
                  - dans la raquette
                </th>
                <td style={{ color: "white" }} id="hDefRating">
                  {hOPP_PTS_PAINT}
                </td>
                <td style={{ color: "white" }} id="aDefRat">
                  {aOPP_PTS_PAINT}
                </td>
              </tr>
              <tr>
              <th scope="row" className="left">
                  - en contre attaque
                </th>
                <td style={{ color: "white" }} id="hDefRating">
                  {hOPP_PTS_FB}
                </td>
                <td style={{ color: "white" }} id="aDefRat">
                  {aOPP_PTS_FB}
                </td>
              </tr>
            </tbody>
            </table>
         )}  {" "}
        </div>

        <div className="d-flex justify-content-center">
          <TeamsStatsButtonBar
            lastNgames={lastNgames}
            setLastNGames={setLastNGames}
            homeOrAway={homeOrAway}
            setHomeOrAway={setHomeOrAway}
            winLose={winLose}
            setWinLose={setWinLose}
            vsMatchup={vsMatchup}
            setVsMatchup={setVsMatchup}
            paceAdjust={paceAdjust}
            setPaceAdjust={setPaceAdjust}
            seasonType={seasonType}
            setSeasonType={setSeasonType}
          />
        </div>
      </div>

      <div style={{ display: subMenuItem == 2 ? "block" : "none" }}>
        <Injuries
          teams={props.teams}
          hTeamName={props.hTeamName}
          aTeamName={props.aTeamName}
        />
      </div>
      {(subMenuItem == 1 || subMenuItem == 3) && (
        <PlayersStats
          teams={props.teams}
          hTeamName={props.hTeamName}
          aTeamName={props.aTeamName}
          registered={props.registered}
          user={props.user}
          it={props.it}
          setIt={props.setIt}
          gameId={props.gameId}
          startTime={props.startTime}
          startDate={props.startDate}
          subMenuItem={subMenuItem}
        />
      )}
      <div style={{ display: subMenuItem == 1 ? "block" : "none" }}>
        {showBets(gameId)}
      </div>
    </div>
  );
}

export default TeamsStatsArrays;
