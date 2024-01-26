import React, { useState, useEffect } from "react";
import "../styles/PlayersStatsArray.css";

function betStatForm(props) {
  const [betAmount, setBetAmount] = useState(10);
  const [betTypeAmount, setBetTypeAmount] = useState(0);
  const [homeOrAway, setHomeOrAway] = useState(0);
  const [betOdd, setBetOdd] = useState(1.5);

  useEffect(() => {
    setBetTypeAmount(props.statValue);
  }, [props.statValue]);

  function bet() {
    if (props.registered == "Registration successful") {
      props.setIt(props.it + 1);
      // Send the registration data to your Symfony backend API

      fetch("index.php/bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          team: homeOrAway,
          odd: betOdd,
          user: props.user,
          game: props.name,
          gameId: props.gameId,
          betAmount: betAmount,
          startTime: props.startTime,
          startDate: props.startDate,
          betType: props.stat,
          betTypeAmount: betTypeAmount,
          playerId: props.id,
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

  return (
    <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
      <table
        className="col-md-10  table table-hover table-dark bg-dark text-white large"
        style={{ borderRadius: "4rem", margin: "auto" }}
      >
        <tbody>
          <tr>
            <td style={{fontSize: "1rem"}}>
              <span><strong>{props.name} :</strong>
            Au moins  {betTypeAmount} {props.stat}</span>  
            </td>
            <td style={{fontSize: "1rem"}}>
              Cote :{betOdd}
             
            </td>
            <td style={{ padding: "2rem" }}>
              Mise :{" "}
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
              <button className="btn btn-primary w-50 " onClick={() => bet()}>
                {" "}
                Parier{" "}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default betStatForm;
