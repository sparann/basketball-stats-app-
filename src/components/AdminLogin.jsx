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
      setError("don't worry bout it");
      setPassword('');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <div className="bg-surface rounded-2xl shadow-lg border border-line overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-ink mb-2">Admin Login</h2>
          <p className="text-ink-2 mb-6">Only accessible if you can beat Wyatt 1v1.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border-2 border-line rounded-xl font-semibold text-ink focus:border-accent focus:outline-none transition-colors"
              autoFocus
            />

            {error && (
              <p className="text-danger text-sm font-semibold">{error}</p>
            )}

            <button
              type="submit"
              className="w-full px-5 py-3 bg-accent text-accent-ink rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
