import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import EditPlayerModal from './EditPlayerModal';
import { useUI } from '../context/ui-context';
import { isGuest } from '../utils/guests';

const ManagePlayers = ({ players, onUpdatePlayer, onDeletePlayer }) => {
  const { toast, confirm } = useUI();
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleAddPlayer = async () => {
    if (newPlayerName.trim()) {
      try {
        if (isSupabaseConfigured()) {
          const { error } = await supabase
            .from('players')
            .insert([{ name: newPlayerName.trim() }]);

          if (error) throw error;
        }

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
            lastPlayed: null,
            sessions: []
          });
        }
        setNewPlayerName('');
        setShowAddPlayer(false);
      } catch (error) {
        console.error('Error adding player:', error);
        toast(`Couldn't add player: ${error.message}`, { type: 'error' });
      }
    }
  };

  const handleDelete = async (playerName) => {
    const ok = await confirm({
      title: `Remove ${playerName}?`,
      message: 'They come off the standings and out of every session they played in. This cannot be undone.',
      confirmLabel: 'Remove',
      destructive: true
    });
    if (ok && onDeletePlayer) onDeletePlayer(playerName);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-2xl shadow-lg border border-line overflow-hidden">
        <div className="p-6 border-b border-line">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-ink">Manage Players</h2>
              <p className="text-ink-2 mt-1">Edit player details and remove players</p>
            </div>
            <button
              onClick={() => setShowAddPlayer(true)}
              className="px-5 py-2.5 bg-accent text-accent-ink rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
            >
              + Add Player
            </button>
          </div>
        </div>

        {showAddPlayer && (
          <div className="p-6 border-b border-line bg-surface-2">
            <h3 className="text-lg font-bold text-ink mb-3">Add New Player</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Player name"
                className="flex-1 px-4 py-3 border-2 border-line rounded-xl font-semibold text-ink focus:border-accent focus:outline-none transition-colors"
                autoFocus
              />
              <button
                onClick={handleAddPlayer}
                className="px-5 py-3 bg-accent text-accent-ink rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddPlayer(false);
                  setNewPlayerName('');
                }}
                className="px-5 py-3 bg-line-strong text-ink rounded-xl font-semibold hover:bg-line-strong transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-line">
          {players.map((player) => (
            <div key={player.name} className="p-6 hover:bg-surface-2 transition-colors">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {player.pictureUrl ? (
                    <img
                      src={player.pictureUrl}
                      alt={player.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-line"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-line-strong flex items-center justify-center text-ink-2 text-xl font-bold border-2 border-line">
                      {getInitials(player.name)}
                    </div>
                  )}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-ink flex items-center gap-2">
                    {player.name}
                    {isGuest(player.name) && <span className="text-[10px] font-bold tracking-[0.08em] text-ink-3">GUEST · hidden from standings</span>}
                  </h3>
                  <div className="flex gap-4 text-sm text-ink-2 mt-1">
                    <span><strong className="text-ink">{player.totalGamesPlayed}</strong> games</span>
                    <span><strong className="text-ink">{player.totalGamesWon}</strong> wins</span>
                    <span><strong className="text-ink">{player.sessionsAttended}</strong> sessions</span>
                  </div>
                  {player.injured && (
                    <span className="inline-block mt-2 text-xs font-semibold text-danger bg-danger-soft px-2 py-1 rounded-full">
                      Injured
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingPlayer(player)}
                    className="px-4 py-2 bg-surface-2 text-ink rounded-xl font-semibold text-sm hover:bg-line-strong transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(player.name)}
                    className="px-4 py-2 bg-danger-soft text-danger rounded-xl font-semibold text-sm hover:brightness-110 transition-colors"
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
