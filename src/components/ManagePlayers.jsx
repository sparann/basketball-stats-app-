import { useState } from 'react';
import EditPlayerModal from './EditPlayerModal';

const ManagePlayers = ({ players, onUpdatePlayer, onDeletePlayer }) => {
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      if (onUpdatePlayer) {
        onUpdatePlayer({
          name: newPlayerName.trim(),
          pictureUrl: '',
          injured: false,
          height: '',
          weight: '',
          totalGamesPlayed: 0,
          totalGamesWon: 0,
          sessionsAttended: 0,
          overallWinPercentage: 0,
          lastPlayed: new Date().toISOString().split('T')[0],
          sessions: []
        });
      }
      setNewPlayerName('');
      setShowAddPlayer(false);
    }
  };

  const handleDelete = (playerName) => {
    if (window.confirm(`Are you sure you want to delete ${playerName}? This cannot be undone.`)) {
      if (onDeletePlayer) {
        onDeletePlayer(playerName);
      }
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Manage Players</h2>
              <p className="text-slate-600 mt-1">Edit player details and remove players</p>
            </div>
            <button
              onClick={() => setShowAddPlayer(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
            >
              + Add Player
            </button>
          </div>
        </div>

        {showAddPlayer && (
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Add New Player</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Player name"
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 focus:border-blue-500 focus:outline-none transition-colors"
                autoFocus
              />
              <button
                onClick={handleAddPlayer}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddPlayer(false);
                  setNewPlayerName('');
                }}
                className="px-5 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-200">
          {players.map((player) => (
            <div key={player.name} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {player.pictureUrl ? (
                    <img
                      src={player.pictureUrl}
                      alt={player.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xl font-bold border-2 border-slate-100">
                      {getInitials(player.name)}
                    </div>
                  )}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-slate-900">{player.name}</h3>
                  <div className="flex gap-4 text-sm text-slate-600 mt-1">
                    <span><strong className="text-slate-900">{player.totalGamesPlayed}</strong> games</span>
                    <span><strong className="text-slate-900">{player.totalGamesWon}</strong> wins</span>
                    <span><strong className="text-slate-900">{player.sessionsAttended}</strong> sessions</span>
                  </div>
                  {player.injured && (
                    <span className="inline-block mt-2 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                      Injured
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingPlayer(player)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(player.name)}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingPlayer && (
        <EditPlayerModal
          player={editingPlayer}
          onClose={() => setEditingPlayer(null)}
          onSave={onUpdatePlayer}
        />
      )}
    </div>
  );
};

export default ManagePlayers;
