import React from 'react';

/**
 * Bouton « Connexion » : ouvre/ferme le formulaire de connexion (SignInForm).
 * L'état connecté est géré par la Navbar (nom + déconnexion).
 */
function SignIn(props) {
  return (
    <div id="signButton" className="d-inline-block">
      <button
        className="btn btn-sm btn-outline-light mr-2"
        onClick={() => props.setShowSignIn(!props.showSignIn)}
      >
        Connexion
      </button>
    </div>
  );
}

export default SignIn;
