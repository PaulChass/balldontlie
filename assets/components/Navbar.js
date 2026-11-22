import React from 'react';
import '../styles/NavBar.css'
import Registration from './Registration'
import SignIn from './SignIn'

/**
 * Barre de navigation : liens de section + zone d'authentification.
 * Les paris ayant été retirés, plus de « Mes paris » ni d'affichage de solde :
 * les comptes servent désormais aux commentaires.
 */
function Navbar(props) {
  const isLogged = props.user !== "";

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            <li className={props.menuItem == 0 ? 'nav-item active' : 'nav-item'}>
              <a className="nav-link" onClick={() => props.setMenuItem(0)}>Accueil</a>
            </li>
            <li className={props.menuItem == 3 ? 'nav-item active' : 'nav-item'}>
              <a className="nav-link" onClick={() => props.setMenuItem(3)}>Face-à-Face</a>
            </li>
          </ul>
        </div>
        <div className="navbar-text">
          {isLogged ? (
            <span className="user-info d-flex align-items-center">
              <span className="mr-2" style={{ fontWeight: 600 }}>Salut, {props.user}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-light logout-btn"
                onClick={props.logout}
              >
                Déconnexion
              </button>
            </span>
          ) : (
            <span className="user-info d-flex align-items-center">
              <Registration
                registered={props.registered}
                setRegistered={props.setRegistered}
                user={props.user}
                setMenuItem={props.setMenuItem}
                menuItem={props.menuItem}
              />
              <SignIn
                registered={props.registered}
                setRegistered={props.setRegistered}
                user={props.user}
                setShowSignIn={props.setShowSignIn}
                showSignIn={props.showSignIn}
              />
            </span>
          )}
        </div>
      </nav>
    </div>
  );
}

export default Navbar
