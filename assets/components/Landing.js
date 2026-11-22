import React from 'react';
import LastNightGames from './LastNightGames';

/**
 * Page d'accueil : présentation du site + appel à l'action vers les matchs
 * du soir (le carousel en haut de page), puis les résultats de la nuit.
 */
function Landing() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const features = [
    ['🏀', 'Les matchs du soir', "Tous les matchs NBA à venir, en un coup d'œil."],
    ['📊', "Stats d'équipes & de joueurs", 'Saison, 5/10 derniers matchs, domicile/extérieur, face à un adversaire.'],
    ['🎯', 'Probabilité de victoire', 'Notre estimation (Net Rating + avantage du terrain + blessés), comparée à la cote du bookmaker.'],
    ['💬', 'Commentaires', "Donne ton avis sur chaque match — il suffit d'un compte gratuit."],
  ];

  return (
    <div className="landing text-white">
      <div
        className="hero col-lg-9 col-11 mx-auto text-center bg-dark"
        style={{ opacity: 0.9, borderRadius: '1rem', padding: '2.5rem 1.5rem', marginTop: '1rem' }}
      >
        <h1 className="whitetitle" style={{ marginTop: 0 }}>
          Balldontlie — stats, cotes &amp; pronostics NBA
        </h1>
        <p style={{ fontSize: '1.15rem', fontWeight: 450, opacity: 0.95, maxWidth: '640px', margin: '1rem auto' }}>
          Analyse chaque match du soir : stats d'équipes et de joueurs, probabilité
          de victoire estimée par notre modèle et comparée à la cote du bookmaker,
          et résultats de la nuit.
        </p>

        <div className="row justify-content-center mt-4">
          {features.map(([icon, title, text]) => (
            <div key={title} className="col-md-6 mb-4">
              <div
                className="h-100 p-3"
                style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '0.75rem' }}
              >
                <div style={{ fontSize: '1.8rem' }}>{icon}</div>
                <h5 className="mt-2" style={{ fontWeight: 700 }}>{title}</h5>
                <p className="m-0" style={{ opacity: 0.85 }}>{text}</p>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-light btn-lg mt-2" style={{ fontWeight: 600 }} onClick={scrollToTop}>
          Voir les matchs du soir ↑
        </button>
      </div>

      <div className="container-fluid mt-4">
        <LastNightGames />
      </div>
    </div>
  );
}

export default Landing;
