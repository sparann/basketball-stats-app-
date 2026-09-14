import { useState, useEffect } from 'react';
import { useLiveSession } from './LiveSessionContext';

const StartLiveSessionModal = ({ locations, playerStats, onClose, onSessionStarted }) => {
  const [sessionDate, setSessionDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [sessionLocation, setSessionLocation] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const { actions } = useLiveSession();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const togglePlayer = (playerName) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerName)) {
      newSelected.delete(playerName);
    } else {
      newSelected.add(playerName);
    }
    setSelectedPlayers(newSelected);
  };

  const filteredPlayers = playerStats?.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    if (selectedPlayers.size < 4) {
      setMessage({ type: 'error', text: 'Please select at least 4 players to start a live session' });
      setIsSubmitting(false);
      return;
    }

    try {
      const playerNames = Array.from(selectedPlayers);
      // Build player objects with pictureUrl from playerStats
      const playerObjects = playerNames.map(name => {
        const playerData = playerStats.find(p => p.name === name);
        return {
          name,
          pictureUrl: playerData?.pictureUrl || null
        };
      });
      const newSession = await actions.startSession(sessionDate, sessionLocation, playerObjects);

      if (onSessionStarted) {
        onSessionStarted(newSession);
      }
      onClose();
    } catch (error) {
      setMessage({ type: 'error', text: `Error starting session: ${error.message}` });
      setIsSubmitting(false);
    }
  };

  const getMessageClass = () => {
    if (message.type === 'error') return 'bg-danger-soft text-danger border-danger';
    if (message.type === 'success') return 'bg-accent-soft text-accent border-line-strong';
    return 'bg-surface-2 text-ink border-line';
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-line bg-accent">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Start Live Session
              </h2>
              <p className="text-accent-ink/80 text-sm mt-1">Track games in real-time courtside</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-accent-ink/80 text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Session Date */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-ink uppercase tracking-wide">
              Session Date
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-line rounded-xl font-semibold text-ink focus:border-accent focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-ink uppercase tracking-wide">
              Location (Optional)
            </label>
            <select
              value={sessionLocation}
              onChange={(e) => setSessionLocation(e.target.value)}
              className="w-full px-4 py-3 border-2 border-line rounded-xl font-semibold text-ink focus:border-accent focus:outline-none transition-colors"
            >
              <option value="">No location</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Player Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-ink uppercase tracking-wide">
                Select Players
              </label>
              <span className={`text-sm font-bold ${selectedPlayers.size >= 4 ? 'text-accent' : 'text-ink-3'}`}>
                {selectedPlayers.size} selected {selectedPlayers.size >= 4 ? '✓' : '(min 4)'}
              </span>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border-2 border-line rounded-xl font-semibold text-ink focus:border-accent focus:outline-none transition-colors"
            />

            {/* Player List */}
            <div className="max-h-64 overflow-y-auto space-y-2 p-2 bg-surface-2 rounded-xl border-2 border-line">
              {filteredPlayers.length === 0 ? (
                <p className="text-ink-2 text-center py-4">
                  {searchQuery ? 'No players found' : 'No players available. Add players first in the Players tab.'}
                </p>
              ) : (
                filteredPlayers.map((player) => (
                  <button
                    key={player.name}
                    type="button"
                    onClick={() => togglePlayer(player.name)}
                    className={`w-full px-4 py-3 rounded-xl font-semibold text-left transition-all ${
                      selectedPlayers.has(player.name)
                        ? 'bg-accent text-accent-ink shadow-md'
                        : 'bg-surface text-ink hover:bg-surface-2 border-2 border-line'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{player.name}</span>
                      {selectedPlayers.has(player.name) && (
                        <span className="text-accent-ink/80">✓</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          {playerStats && playerStats.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedPlayers(new Set(playerStats.map(p => p.name)))}
                className="flex-1 px-4 py-2 bg-surface-2 text-ink rounded-xl font-semibold text-sm hover:bg-line-strong transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlayers(new Set())}
                className="flex-1 px-4 py-2 bg-surface-2 text-ink rounded-xl font-semibold text-sm hover:bg-line-strong transition-colors"
              >
                Clear All
              </button>
            </div>
          )}

          {message.text && (
            <div className={`p-4 rounded-xl border-2 font-semibold ${getMessageClass()}`}>
              {message.text}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || selectedPlayers.size < 4}
              className="flex-1 px-5 py-3 bg-accent text-accent-ink rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Starting...' : 'Start Live Session'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-surface-2 text-ink rounded-xl font-semibold hover:bg-line-strong transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartLiveSessionModal;
