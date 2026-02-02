import { useState } from 'react';

const AdminLogin = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simple password check (stored in environment variable)
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'basketball2025';

    if (password === adminPassword) {
      onLogin();
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
    <div className="admin-login">
      <div className="login-card">
        <h2>🔒 Admin Login</h2>
        <p>Enter the admin password to add new sessions</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="password-input"
            autoFocus
          />

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>

        <p className="hint">Default password: basketball2025</p>
      </div>
    </div>
  );
};

export default AdminLogin;
