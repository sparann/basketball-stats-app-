import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AdminPanel = ({ onLogout, onSessionAdded }) => {
  const [sessionDate, setSessionDate] = useState('');
  const [players, setPlayers] = useState([
    { name: '', gamesPlayed: '', gamesWon: '', notes: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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

    // Validate data
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

    // Convert to correct format
    const sessionData = {
      date: sessionDate,
      players: validPlayers.map((p) => ({
        name: p.name.trim(),
        gamesPlayed: parseInt(p.gamesPlayed),
        gamesWon: parseInt(p.gamesWon),
        notes: p.notes.trim()
      }))
    };

    // Check if someone won more games than they played
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
        // Save to Supabase
        const { error } = await supabase.from('sessions').insert([sessionData]);

        if (error) throw error;

        setMessage({ type: 'success', text: 'Session added successfully!' });

        // Reset form
        setSessionDate('');
        setPlayers([{ name: '', gamesPlayed: '', gamesWon: '', notes: '' }]);

        // Notify parent to refresh data
        if (onSessionAdded) onSessionAdded();
      } else {
        setMessage({
          type: 'warning',
          text: 'Supabase not configured. Session data displayed below (copy to stats.json):'
        });
        console.log('Session data to add:', JSON.stringify(sessionData, null, 2));
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>📝 Add New Session</h2>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>

      <form onSubmit={handleSubmit} className="session-form">
        <div className="form-group">
          <label htmlFor="session-date">Session Date</label>
          <input
            type="date"
            id="session-date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="date-input"
            required
          />
        </div>

        <div className="players-section">
          <h3>Players</h3>

          {players.map((player, index) => (
            <div key={index} className="player-row">
              <input
                type="text"
                placeholder="Player Name"
                value={player.name}
                onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                className="player-input"
                required
              />
              <input
                type="number"
                placeholder="Games Played"
                value={player.gamesPlayed}
                onChange={(e) => updatePlayer(index, 'gamesPlayed', e.target.value)}
                className="number-input"
                min="0"
                required
              />
              <input
                type="number"
                placeholder="Games Won"
                value={player.gamesWon}
                onChange={(e) => updatePlayer(index, 'gamesWon', e.target.value)}
                className="number-input"
                min="0"
                required
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                value={player.notes}
                onChange={(e) => updatePlayer(index, 'notes', e.target.value)}
                className="notes-input"
              />
              <button
                type="button"
                onClick={() => removePlayerRow(index)}
                className="remove-btn"
                disabled={players.length === 1}
                title="Remove player"
              >
                ✕
              </button>
            </div>
          ))}

          <button type="button" onClick={addPlayerRow} className="add-player-btn">
            + Add Another Player
          </button>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <button type="submit" disabled={isSubmitting} className="submit-btn">
          {isSubmitting ? 'Adding Session...' : 'Add Session'}
        </button>
      </form>

      {!isSupabaseConfigured() && (
        <div className="warning-box">
          <p>
            ⚠️ Supabase is not configured yet. Follow the setup guide to enable database
            storage.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
