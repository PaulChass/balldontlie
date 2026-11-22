import React, { useState } from 'react';

/**
 * Formulaire d'inscription (affiché quand menuItem == 5).
 * N'envoie que nom, email et mot de passe — plus de champs liés aux paris.
 */
function RegistrationForm(props) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
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
    fetch('index.php/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        setLoading(false);
        if (data.message !== 'Registration successful') {
          setError(data.message || 'Inscription impossible.');
        } else {
          props.setUser(formData.name);
          props.setRegistered(data.message);
          props.setMenuItem(0);
        }
      })
      .catch(() => {
        setLoading(false);
        setError('Inscription impossible pour le moment.');
      });
  };

  if (props.menuItem != 5) {
    return null;
  }

  return (
    <div
      id="reg"
      className="auth-card w-100 mx-auto bg-dark text-white m-3 p-4"
      style={{ maxWidth: '420px', opacity: 0.95, borderRadius: '1rem' }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="m-0" style={{ fontSize: '1.5rem' }}>Créer un compte</h2>
        <button
          type="button"
          className="btn btn-sm btn-outline-light"
          aria-label="Fermer"
          onClick={() => props.setMenuItem(0)}
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Nom d'utilisateur</label>
          <input
            type="text"
            name="name"
            className="form-control"
            value={formData.name}
            required
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={formData.email}
            required
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Mot de passe</label>
          <input
            type="password"
            name="password"
            className="form-control"
            value={formData.password}
            required
            onChange={handleChange}
          />
        </div>

        {error && <p className="text-warning text-center">{error}</p>}

        <button type="submit" className="btn btn-primary w-100 mt-2" disabled={loading}>
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
    </div>
  );
}

export default RegistrationForm;
