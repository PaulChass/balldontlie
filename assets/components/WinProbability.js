import React from "react";
import { useState, useEffect } from "react";

/**
 * Probabilité de victoire estimée par notre modèle statistique, et comparaison
 * avec la cote du bookmaker (Parions Sport) pour faire ressortir la « value ».
 *
 * props :
 *   - teams        : [idDomicile, idExterieur] (ids NBA)
 *   - hTeamName / aTeamName : noms affichés
 *   - bookmaker    : objet { hOdds, aOdds } renvoyé par /simulation (optionnel)
 */
function WinProbability(props) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!props.teams || props.teams[0] === 0 || props.teams[0] === undefined) {
      return;
    }
    setLoading(true);
    setError("");
    const url =
      "https://balldontlie.fr/index.php/win-probability/" +
      props.teams[0] +
      "/" +
      props.teams[1];
    let alive = true;
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return;
        if (json && json.data && json.data.pHome !== undefined) {
          setData(json.data);
        } else {
          setError("Estimation indisponible pour ce match.");
        }
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError("Estimation indisponible pour le moment.");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [props.teams]);

  if (loading) {
    return (
      <div className="text-white text-center p-3">
        <em>Calcul de la probabilité de victoire…</em>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="text-white text-center p-3">
        <em>{error || "Estimation indisponible."}</em>
      </div>
    );
  }

  const pHome = data.pHome * 100;
  const pAway = data.pAway * 100;
  const homeName = props.hTeamName || data.home.name;
  const awayName = props.aTeamName || data.away.name;

  // Cote du bookmaker (de-viggée côté serveur) → proba implicite = 1/cote.
  const bk = props.bookmaker;
  const hOdds = bk && bk.hOdds ? parseFloat(bk.hOdds) : null;
  const aOdds = bk && bk.aOdds ? parseFloat(bk.aOdds) : null;
  const impliedHome = hOdds ? (100 / hOdds).toFixed(1) : null;
  const impliedAway = aOdds ? (100 / aOdds).toFixed(1) : null;
  // « Value » : notre proba dépasse la proba implicite du bookmaker.
  const valueHome = impliedHome !== null && pHome > parseFloat(impliedHome);
  const valueAway = impliedAway !== null && pAway > parseFloat(impliedAway);

  const renderInjuries = (side) => {
    if (!side.injuries || side.injuries.length === 0) {
      return <span>aucun absent significatif</span>;
    }
    return side.injuries
      .map((p) => `${p.player} (${p.status}, −${p.impact} pts)`)
      .join(", ");
  };

  return (
    <div className="col-lg-10 mx-auto text-white" style={{ marginBottom: "1rem" }}>
      <h3 className="text-center p-2">
        Probabilité de victoire{" "}
        <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>(modèle statistique)</span>
      </h3>

      {/* Barre de probabilité */}
      <div
        className="d-flex"
        style={{ borderRadius: "0.5rem", overflow: "hidden", height: "2.2rem", fontWeight: 700 }}
      >
        <div
          className="d-flex align-items-center justify-content-start px-2"
          style={{ width: pHome + "%", background: "#2e7d32", whiteSpace: "nowrap", minWidth: "fit-content" }}
          title={homeName}
        >
          {pHome.toFixed(0)}%
        </div>
        <div
          className="d-flex align-items-center justify-content-end px-2"
          style={{ width: pAway + "%", background: "#8b4513", whiteSpace: "nowrap", minWidth: "fit-content" }}
          title={awayName}
        >
          {pAway.toFixed(0)}%
        </div>
      </div>
      <div className="d-flex justify-content-between px-1" style={{ fontSize: "0.85rem" }}>
        <span>🏠 {homeName}</span>
        <span>{awayName} ✈️</span>
      </div>

      {/* Tableau détaillé + comparaison bookmaker */}
      <table className="table table-dark table-sm mt-3" style={{ borderRadius: "0.5rem", overflow: "hidden" }}>
        <thead>
          <tr>
            <th></th>
            <th className="text-center">Proba modèle</th>
            <th className="text-center">Cote équitable</th>
            {hOdds && <th className="text-center">Cote Parions Sport</th>}
            {hOdds && <th className="text-center">Proba implicite</th>}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">🏠 {homeName}</th>
            <td className="text-center">{pHome.toFixed(1)}%</td>
            <td className="text-center">{data.fairOddsHome}</td>
            {hOdds && <td className="text-center">{hOdds.toFixed(2)}</td>}
            {hOdds && (
              <td className="text-center">
                {impliedHome}% {valueHome && <span title="Notre modèle donne le domicile plus probable que le bookmaker">✅ value</span>}
              </td>
            )}
          </tr>
          <tr>
            <th scope="row">{awayName} ✈️</th>
            <td className="text-center">{pAway.toFixed(1)}%</td>
            <td className="text-center">{data.fairOddsAway}</td>
            {aOdds && <td className="text-center">{aOdds.toFixed(2)}</td>}
            {aOdds && (
              <td className="text-center">
                {impliedAway}% {valueAway && <span title="Notre modèle donne l'extérieur plus probable que le bookmaker">✅ value</span>}
              </td>
            )}
          </tr>
        </tbody>
      </table>

      {/* Explication du calcul */}
      <details className="mt-2" style={{ fontSize: "0.9rem", opacity: 0.95 }}>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>Comment c'est calculé ?</summary>
        <div className="mt-2">
          <p>
            On compare la <strong>force des deux équipes</strong> via leur{" "}
            <em>Net Rating</em> (différence de points marqués − encaissés pour 100
            possessions sur la saison), ramenée au rythme du match, puis on ajoute
            l'avantage du terrain et on retire l'impact des blessés.
          </p>
          <ol style={{ paddingLeft: "1.2rem" }}>
            <li>
              Net Rating : <strong>{homeName}</strong> {data.home.net >= 0 ? "+" : ""}
              {data.home.net} · <strong>{awayName}</strong> {data.away.net >= 0 ? "+" : ""}
              {data.away.net}. Rythme moyen du match ≈ {data.params.possessions} possessions.
            </li>
            <li>
              Écart de base = ({data.home.net} − {data.away.net}) ×{" "}
              {data.params.possessions}/100 ={" "}
              <strong>{data.baseMargin >= 0 ? "+" : ""}{data.baseMargin} pts</strong> pour le
              domicile.
            </li>
            <li>
              + avantage du terrain : <strong>+{data.params.homeAdvantage} pts</strong>.
            </li>
            <li>
              Blessés (−0,5 × points/match × gravité du statut) :<br />
              <strong>{homeName}</strong> : {renderInjuries(data.home)}
              {" "}(total −{data.home.injuryImpact} pts).<br />
              <strong>{awayName}</strong> : {renderInjuries(data.away)}
              {" "}(total −{data.away.injuryImpact} pts).
            </li>
            <li>
              Écart attendu ={" "}
              <strong>{data.expectedMargin >= 0 ? "+" : ""}{data.expectedMargin} pts</strong> pour
              le domicile.
            </li>
            <li>
              Conversion en probabilité via la loi normale (écart-type d'un match NBA ≈{" "}
              {data.params.sigma} pts) : P(domicile) = Φ(écart ÷ {data.params.sigma}) ={" "}
              <strong>{pHome.toFixed(1)}%</strong>.
            </li>
          </ol>
          <p style={{ fontStyle: "italic", opacity: 0.75 }}>
            Estimation indicative : fondée sur l'efficacité de la saison, l'avantage du
            terrain et les blessés connus. Elle ne modélise pas la fatigue (back-to-back),
            les déplacements, ni la forme récente, et valorise les blessés de façon
            approximative. À comparer, pas à suivre les yeux fermés.
          </p>
        </div>
      </details>
    </div>
  );
}

export default WinProbability;
