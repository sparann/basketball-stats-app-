import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const EditSessionModal = ({ session, locations, onClose, onSessionUpdated, playerStats }) => {
  const isEditing = !!session;
  const [sessionDate, setSessionDate] = useState(session?.date || '');
  const [sessionLocation, setSessionLocation] = useState(session?.location || '');
  const [totalGames, setTotalGames] = useState(session?.totalGames?.toString() || '');
  const [players, setPlayers] = useState(
    session?.players.map(p => ({
      name: p.name,
      gamesPlayed: p.gamesPlayed.toString(),
      gamesWon: p.gamesWon.toString(),
      notes: p.notes || ''
    })) || [{ name: '', gamesPlayed: '', gamesWon: '', notes: '' }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const addPlayerRow = () => {
    setPlayers([...players, { name: '', gamesPlayed: '', gamesWon: '', notes: '' }]);
  };

  const removePlayerRow = (index) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const updatePlayer = (index, field, value) => {
    const updated = [...players];
    updated[index][field] = value;
    setPlayers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    if (!sessionDate) {
      setMessage({ type: 'error', text: 'Please enter a session date' });
      setIsSubmitting(false);
      return;
    }

    const validPlayers = players.filter(
      (p) => p.name && p.gamesPlayed && p.gamesWon
    );

    if (validPlayers.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one player' });
      setIsSubmitting(false);
      return;
    }

    const sessionData = {
      date: sessionDate,
      location: sessionLocation,
      players: validPlayers.map((p) => ({
        name: p.name.trim(),
        gamesPlayed: parseInt(p.gamesPlayed),
        gamesWon: parseInt(p.gamesWon),
        notes: p.notes.trim()
      }))
    };

    // Only include totalGames if it's provided
    if (totalGames && parseInt(totalGames) > 0) {
      sessionData.totalGames = parseInt(totalGames);
    }

    for (const player of sessionData.players) {
      if (player.gamesWon > player.gamesPlayed) {
        setMessage({
          type: 'error',
          text: `${player.name} can't win more games than they played`
        });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      if (isSupabaseConfigured()) {
        if (isEditing) {
          // Update existing session
          const { error } = await supabase
            .from('sessions')
            .update(sessionData)
            .eq('id', session.id);

          if (error) throw error;
        } else {
          // Add new session
          const { error } = await supabase.from('sessions').insert([sessionData]);
          if (error) throw error;
        }

        if (onSessionUpdated) onSessionUpdated();
        onClose();
      } else {
        setMessage({
          type: 'warning',
          text: 'Supabase not configured. Session data displayed below (copy to stats.json):'
        });
        console.log('Session data:', JSON.stringify(sessionData, null, 2));
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }

    setIsSubmitting(false);
  };

  const getMessageClass = () => {
    if (message.type === 'error') return 'bg-danger-soft text-danger border-danger';
    if (message.type === 'success') return 'bg-accent-soft text-accent border-line-strong';
    if (message.type === 'warning') return 'bg-accent-soft text-ink-2 border-line-strong';
    return 'bg-surface-2 text-ink border-line';
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-line">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-ink">
              {isEditing ? 'Edit Session' : 'Add New Session'}
            </h2>
            <button
              onClick={onClose}
              className="text-ink-3 hover:text-ink text-2xl font-bold transition-colors"
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
              disabled={isEditing}
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

          {/* Total Games */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-ink uppercase tracking-wide">
              Total Games Played (Optional)
            </label>
            <input
              type="number"
              value={totalGames}
              onChange={(e) => setTotalGames(e.target.value)}
              placeholder="e.g., 10"
              className="w-full px-4 py-3 border-2 border-line rounded-xl font-semibold text-ink focus:border-accent focus:outline-none transition-colors"
              min="1"
            />
            <p className="text-xs text-ink-2">If not filled out, will use the highest number of games played by any player in this session</p>
          </div>

          {/* Players */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-ink">Players</h3>

            {players.map((player, index) => (
              <div key={index} className="space-y-3 p-4 bg-surface-2 rounded-xl">
                <div className="flex gap-3 items-start flex-wrap">
                  <select
                    value={player.name}
                    onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                    className="flex-1 min-w-[150px] px-4 py-3 border-2 border-line rounded-xl font-semibold text-ink focus:border-accent focus:outline-none transition-colors"
                    required
                  >
                    <option value="">Select Player</option>
                    {playerStats && playerStats.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-ink-2 px-1">Games Played</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updatePlayer(index, 'gamesPlayed', Math.max(0, parseInt(player.gamesPlayed || 0) - 1).toString())}
                        className="w-10 h-10 bg-surface border-2 border-line rounded-lg font-bold text-ink hover:bg-surface-2 transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={player.gamesPlayed}
                        onChange={(e) => updatePlayer(index, 'gamesPlayed', e.target.value)}
                        className="w-16 px-2 py-2 border-2 border-line rounded-lg font-bold text-center text-ink focus:border-accent focus:outline-none transition-colors"
                        min="0"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => updatePlayer(index, 'gamesPlayed', (parseInt(player.gamesPlayed || 0) + 1).toString())}
                        className="w-10 h-10 bg-surface border-2 border-line rounded-lg font-bold text-ink hover:bg-surface-2 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-ink-2 px-1">Games Won</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updatePlayer(index, 'gamesWon', Math.max(0, parseInt(player.gamesWon || 0) - 1).toString())}
                        className="w-10 h-10 bg-surface border-2 border-line rounded-lg font-bold text-ink hover:bg-surface-2 transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={player.gamesWon}
                        onChange={(e) => updatePlayer(index, 'gamesWon', e.target.value)}
                        className="w-16 px-2 py-2 border-2 border-line rounded-lg font-bold text-center text-ink focus:border-accent focus:outline-none transition-colors"
                        min="0"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => updatePlayer(index, 'gamesWon', (parseInt(player.gamesWon || 0) + 1).toString())}
                        className="w-10 h-10 bg-surface border-2 border-line rounded-lg font-bold text-ink hover:bg-surface-2 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePlayerRow(index)}
                    className="px-4 py-3 bg-danger-soft text-danger rounded-xl font-bold hover:brightness-110 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-auto"
                    disabled={players.length === 1}
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={player.notes}
                  onChange={(e) => updatePlayer(index, 'notes', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-line rounded-xl font-semibold text-ink focus:border-accent focus:outline-none transition-colors"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={addPlayerRow}
              className="px-5 py-3 bg-surface-2 text-ink rounded-xl font-semibold hover:bg-line-strong transition-colors"
            >
              + Add Another Player
            </button>
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl border-2 font-semibold ${getMessageClass()}`}>
              {message.text}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-5 py-3 bg-accent text-accent-ink rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Session' : 'Add Session')}
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

export default EditSessionModal;
