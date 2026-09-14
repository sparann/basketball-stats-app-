import { useState, useEffect } from 'react';
import { useLiveSession } from './LiveSessionContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const AddPlayerModal = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { actions, players } = useLiveSession();

  // Get all players currently in the session
  const playersInSession = [
    ...players.teamA.map(p => p.name),
    ...players.teamB.map(p => p.name),
    ...players.sittingOut.map(p => p.name)
  ];

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('players')
          .select('name')
          .order('name', { ascending: true });

        if (error) throw error;

        setAllPlayers((data || []).map(p => p.name));
      } catch (err) {
        console.error('Error fetching players:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const handleAddPlayer = async (name) => {
    if (!name.trim()) {
      setError('Please enter a player name');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await actions.addPlayer(name.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add player');
      setIsSubmitting(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    handleAddPlayer(searchQuery);
  };

  // Players not yet in this session, narrowed by the search box
  const availablePlayers = allPlayers.filter(name => !playersInSession.includes(name));
  const filteredPlayers = availablePlayers.filter(name =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // An exact match either selects the existing player or explains they're already here
  const query = searchQuery.trim().toLowerCase();
  const isExactMatch = availablePlayers.some(name => name.toLowerCase() === query);
  const alreadyInSession = playersInSession.some(name => name.toLowerCase() === query);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-line bg-accent">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Add Player</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-accent-ink/80 text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Search/Input */}
          <div>
            <label className="block text-sm font-bold text-ink uppercase tracking-wide mb-2">
              Search or Enter Name
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search existing players or type new name..."
              className="w-full px-4 py-3 border-2 border-line rounded-xl font-semibold text-ink focus:border-accent focus:outline-none transition-colors"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="p-3 bg-danger-soft border-2 border-danger rounded-xl">
              <p className="text-danger text-sm font-semibold">{error}</p>
            </div>
          )}

          {/* Existing Players List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent"></div>
            </div>
          ) : (
            <>
              {filteredPlayers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-ink-2 uppercase tracking-wide">
                    Select Existing Player
                  </p>
                  <div className="max-h-64 overflow-y-auto space-y-2 p-2 bg-surface-2 rounded-xl border-2 border-line">
                    {filteredPlayers.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleAddPlayer(name)}
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 rounded-xl font-semibold text-left transition-all bg-surface text-ink hover:bg-accent-soft hover:border-line-strong border-2 border-line disabled:opacity-50"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {alreadyInSession && (
                <p className="text-ink-2 text-sm text-center py-4">
                  {searchQuery.trim()} is already in this session
                </p>
              )}

              {/* Add Custom Name */}
              {searchQuery.trim() && !isExactMatch && !alreadyInSession && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-ink-2 uppercase tracking-wide">
                    Add New Player
                  </p>
                  <button
                    onClick={handleCustomSubmit}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-accent text-accent-ink rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Adding...' : `Add "${searchQuery}" to Bench`}
                  </button>
                </div>
              )}

              {!loading && filteredPlayers.length === 0 && !searchQuery.trim() && (
                <p className="text-ink-2 text-sm text-center py-4">
                  Type to search existing players or add a new one
                </p>
              )}
            </>
          )}

          <div className="bg-surface-2 border-2 border-line rounded-xl p-3">
            <p className="text-ink-2 text-sm font-semibold">
              ℹ️ Player will be added to the bench and can be rotated in for the next game.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full px-5 py-3 bg-surface-2 text-ink rounded-xl font-semibold hover:bg-line-strong transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPlayerModal;
