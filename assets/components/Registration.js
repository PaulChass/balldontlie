import React from 'react';

/**
 * Bouton « Créer un compte » : affiche le formulaire d'inscription
 * (RegistrationForm, montré quand menuItem == 5).
 */
function Registration(props) {
  return (
    <div id="regButton" className="d-inline-block">
      <button
        className="btn btn-sm btn-light mr-2"
        onClick={() => props.setMenuItem(5)}
      >
        Créer un compte
      </button>
    </div>
  );
}

export default Registration;
