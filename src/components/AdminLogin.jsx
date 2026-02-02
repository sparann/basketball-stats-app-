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
    <div className="max-w-md mx-auto mt-12 px-4">
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Login</h2>
          <p className="text-slate-600 mb-6">Only accessible if you can beat Wyatt 1v1.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 focus:border-blue-500 focus:outline-none transition-colors"
              autoFocus
            />

            {error && (
              <p className="text-red-600 text-sm font-semibold">{error}</p>
            )}

            <button
              type="submit"
              className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
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
