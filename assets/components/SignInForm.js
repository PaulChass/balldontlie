import React, { useState } from 'react';

/**
 * Formulaire de connexion (affiché quand showSignIn est vrai).
 * N'envoie que l'identifiant et le mot de passe — plus de champs liés aux paris.
 */
function SignInForm(props) {
  const [formData, setFormData] = useState({ name: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    fetch('index.php/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        setLoading(false);
        if (data.message !== 'Registration successful') {
          setError(data.message || 'Connexion impossible.');
        } else {
          props.setRegistered(data.message);
          props.setUser(formData.name);
          props.setShowSignIn(false);
        }
      })
      .catch(() => {
        setLoading(false);
        setError('Connexion impossible pour le moment.');
      });
  };

  return (
    <div
      id="signin"
      className="auth-card w-100 mx-auto bg-dark text-white m-3 p-4"
      style={{
        maxWidth: '420px',
        opacity: 0.95,
        borderRadius: '1rem',
        display: props.showSignIn ? 'block' : 'none',
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="m-0" style={{ fontSize: '1.5rem' }}>Se connecter</h2>
        <button
          type="button"
          className="btn btn-sm btn-outline-light"
          aria-label="Fermer"
          onClick={() => props.setShowSignIn(false)}
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Identifiant ou email</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            className="form-control"
            required
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Mot de passe</label>
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        {error && <p className="text-warning text-center">{error}</p>}

        <button type="submit" className="btn btn-primary w-100 mt-2" disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}

export default SignInForm;
