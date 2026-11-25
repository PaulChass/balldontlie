import React, { useState, useEffect } from 'react';

/**
 * Infirmerie d'un match (blessés des deux équipes). L'appel API peut échouer :
 * on ne laisse jamais la zone vide sans explication — un état de chargement, un
 * message d'erreur, et un « aucun blessé signalé » quand la liste est vide. Une
 * panne de la source ne bloque pas le reste de la page.
 */
function Injuries(props) {
  const [home, setHome] = useState(null);
  const [away, setAway] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const homeId = props.teams && props.teams[0];
  const awayId = props.teams && props.teams[1];

  useEffect(() => {
    if (!homeId || homeId === 0) return;
    let alive = true;
    setLoading(true);
    setError('');
    setHome(null);
    setAway(null);

    const fetchTeam = (teamId) =>
      fetch('https://balldontlie.fr/index.php/injuries/' + teamId)
        .then((r) => {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then((d) => (d && Array.isArray(d.data) ? d.data : []));

    Promise.all([fetchTeam(homeId), fetchTeam(awayId)])
      .then(([h, a]) => {
        if (!alive) return;
        setHome(h);
        setAway(a);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError("Infirmerie indisponible pour le moment.");
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [homeId, awayId]);

  function showInjuries(injured, teamName) {
    return (
      <div className="col-6 my-0">
        <table className="table table-dark">
          <caption style={{ captionSide: 'top', color: 'white', textAlign: 'center' }}>{teamName}</caption>
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">Blessure</th>
              <th scope="col">Statut</th>
            </tr>
          </thead>
          <tbody>
            {injured.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center">
                  <em>Aucun blessé signalé</em>
                </td>
              </tr>
            )}
            {injured.map((injuredPlayer) => (
              <tr key={injuredPlayer.player}>
                <td>{injuredPlayer.player}</td>
                <td>{injuredPlayer.injury}</td>
                <td>{injuredPlayer.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-white fs-2 text-center p-3 m-3">Infirmerie (source rotowire)</h1>
      {loading && (
        <div className="text-white text-center">
          <em>Chargement de l'infirmerie…</em>
        </div>
      )}
      {error && (
        <div className="text-white text-center">
          <em>{error}</em>
        </div>
      )}
      {!loading && !error && (
        <div className="d-flex">
          {home !== null && showInjuries(home, props.hTeamName)}
          {away !== null && showInjuries(away, props.aTeamName)}
        </div>
      )}
    </div>
  );
}

export default Injuries;
