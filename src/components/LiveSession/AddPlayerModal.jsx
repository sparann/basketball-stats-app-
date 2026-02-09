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

        // Filter out players already in session
        const availablePlayers = (data || [])
          .filter(p => !playersInSession.includes(p.name))
          .map(p => p.name);

        setAllPlayers(availablePlayers);
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

  const filteredPlayers = allPlayers.filter(name =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if search query matches any existing player exactly
  const isExactMatch = allPlayers.some(
    name => name.toLowerCase() === searchQuery.toLowerCase()
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-green-600 to-emerald-600">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Add Player</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-green-100 text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Search/Input */}
          <div>
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
              Search or Enter Name
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search existing players or type new name..."
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

          {/* Existing Players List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent"></div>
            </div>
          ) : (
            <>
              {filteredPlayers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Select Existing Player
                  </p>
                  <div className="max-h-64 overflow-y-auto space-y-2 p-2 bg-slate-50 rounded-xl border-2 border-slate-200">
                    {filteredPlayers.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleAddPlayer(name)}
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 rounded-xl font-semibold text-left transition-all bg-white text-slate-700 hover:bg-green-50 hover:border-green-200 border-2 border-slate-200 disabled:opacity-50"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Custom Name */}
              {searchQuery.trim() && !isExactMatch && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Add New Player
                  </p>
                  <button
                    onClick={handleCustomSubmit}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Adding...' : `Add "${searchQuery}" to Bench`}
                  </button>
                </div>
              )}

              {!loading && filteredPlayers.length === 0 && !searchQuery.trim() && (
                <p className="text-slate-500 text-sm text-center py-4">
                  Type to search existing players or add a new one
                </p>
              )}
            </>
          )}

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
            <p className="text-blue-700 text-sm font-semibold">
              ℹ️ Player will be added to the bench and can be rotated in for the next game.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
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
