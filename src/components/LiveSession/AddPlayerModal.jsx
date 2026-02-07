import { useState } from 'react';
import { useLiveSession } from './LiveSessionContext';

const AddPlayerModal = ({ onClose }) => {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { actions } = useLiveSession();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!playerName.trim()) {
      setError('Please enter a player name');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await actions.addPlayer(playerName.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add player');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-green-600 to-emerald-600">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Add New Player</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-green-100 text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
              Player Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter player name"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 focus:border-green-500 focus:outline-none transition-colors"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-semibold">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
            <p className="text-blue-700 text-sm font-semibold">
              ℹ️ Player will be added to the bench and can be rotated in for the next game.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !playerName.trim()}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add to Bench'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlayerModal;
