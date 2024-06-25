import React, { useState, useEffect } from "react";
import "../styles/AvailableBets.css";
import TopFiveBetters from './TopFiveBetters'
import LastNightGames from './LastNightGames'


function AvailableBets(props) {
  const [bets, setBets] = useState([]);
  const [itb, setItb] = useState(0);
  const [day, setDay] = useState(0);
  const [betsType, setBetsType] = useState("all");

  useEffect(() => {
    let url = "/index.php/availableBets/";
    fetch(url) // Replace with the correct API endpoint URL
      .then((response) => response.json())
      .then((data) => setBets(data.reverse()))
      .catch((error) => console.error("Error fetching data:", error));
  }, [props, itb, betsType]);
  var date = new Date();



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
    var date = new Date();
    var clockTime = date.toLocaleTimeString();
    var clockTimes = clockTime.split(":");
    var hour = date.getHours();
    var day = date.getDate();

    var el = 0;
    var elementId = 0;
    if (hour < 6) {
      day = day - 1;
    }
    setDay(day);

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
        elementId = "atimeToBet" + bets[index]["id"];
        el = document.getElementById(elementId);
        if (el !== null) {
          el.innerHTML = h + "h" + m + "m" + s + "s";
        }
      }
    }
  }

  setInterval(timeToBet, 1000);

  var today = new Date();
  var dateFR = new Date(today.toLocaleString("en-US", { timeZone: "Europe/Paris" }));



  for (let i = 0; i < bets.length; i++) {
    if (bets[i] !== undefined) {
      var startDates = bets[i].startDate.split("-");
      var startDateStr = startDates[1] + '/' + startDates[2] + '/' + startDates[0] + ', ' + bets[i].startTime + ":00";
      var startDate = new Date(startDateStr);
      let startTimeHourMinutes = bets[i].startTime.split(":");
      if (startTimeHourMinutes[0] < 15) {
        startDate.setDate(startDate.getDate() + 1);
      }

      if (startDate < dateFR) {
        bets.splice(i, 1);
        i = i - 1;
      }
    }
  }

  function goToBetPage(gameId, playerId) {
    if (playerId == null) {
      props.setChangeGameId(gameId);
      props.setMenuItem(3);
    }
    else {
      props.setChangeGameId(gameId);
      props.setMenuItem(3);
    }
  }



  for (let index = 0; index < bets.length; index++) {
    if (betsType == "player" && bets[index].type == null) {
      bets.splice(index, 1);
      index--;
    }
    if (betsType == "team" && bets[index].type !== null) {
      bets.splice(index, 1);
      index--;
    }
  }

  return (

    <div className="availableBets ">
      <div className="col-lg-6 mx-auto">
        <span>{props.user !== "" && getBalance(props.user)}</span>
        {props.registered !== "Registration successful" && (
          <div className="text-white text-center w-100">
            <h2 className="m-3 text-center mb-5 mt-4">Le site des parieurs NBA</h2>

          
          </div>
        )}
      </div>
      <div className="container-fluid">
        <div className="row m-auto">
          <div className="col-lg-3 m-auto d-none d-lg-block">
            <a href="https://wlfdj.adsrv.eacdn.com/C.ashx?btag=a_1129b_108c_&affid=460&siteid=1129&adid=108&c=">
              <img src="bonus15.jpg" alt="bonus15" width={180} className="" style={{ marginLeft: "50px", marginTop: "50px", opacity: 0.8 }} />
            </a>
          </div>
          <TopFiveBetters />
          <div className="col-lg-3 m-auto d-none d-lg-block">
            <a href="https://wlfdj.adsrv.eacdn.com/C.ashx?btag=a_1129b_108c_&affid=460&siteid=1129&adid=108&c=">
              <img src="psel.png" alt="psel-image" width={180} className="" style={{ marginLeft: "50px", marginTop: "50px", opacity: 0.8 }} />
            </a>
          </div>
        </div>
        <LastNightGames />
      </div>

      <a href="https://wlfdj.adsrv.eacdn.com/C.ashx?btag=a_1129b_108c_&affid=460&siteid=1129&adid=108&c=" style={{ width: "-webkit-fill-available", textAlign: "center" }}>
        <img src="psel.gif" alt="psel gif" width="400" />
      </a>
    </div >
  );
}
export default AvailableBets;
