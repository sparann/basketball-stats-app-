import { useEffect, useMemo } from 'react';
import { useLiveSession } from './LiveSessionContext';
import { formatDateString } from '../../utils/dateFormatter';

const EndSessionModal = ({ onClose, onConfirm }) => {
  const { session, games, players } = useLiveSession();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Calculate session duration
  const duration = useMemo(() => {
    if (!session?.started_at) return null;

    try {
      const start = new Date(session.started_at);
      if (isNaN(start.getTime())) return null;

      const now = new Date();
      const diffMs = now - start;
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;

      if (hours > 0) {
        return `${hours}h ${mins}m`;
      }
      return `${mins} minutes`;
    } catch (error) {
      console.error('Duration calculation error:', error);
      return null;
    }
  }, [session]);

  // Combine all players and calculate stats
  const allPlayers = useMemo(() => {
    const playerMap = new Map();

    [...players.teamA, ...players.teamB, ...players.sittingOut].forEach(player => {
      if (!playerMap.has(player.name)) {
        playerMap.set(player.name, {
          name: player.name,
          gamesPlayed: player.gamesPlayed,
          gamesWon: player.gamesWon,
          winRate: player.gamesPlayed > 0
            ? Math.round((player.gamesWon / player.gamesPlayed) * 100)
            : 0
        });
      }
    });

    return Array.from(playerMap.values()).sort((a, b) => b.winRate - a.winRate);
  }, [players]);

  const topPerformer = allPlayers.length > 0 ? allPlayers[0] : null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-green-600 to-emerald-600">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">
              End Live Session
            </h2>
            <p className="text-green-100 text-sm mt-1">
              Review session summary before saving
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Session Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <p className="text-3xl font-bold text-blue-600">{games.length}</p>
              <p className="text-xs text-blue-700 font-semibold mt-1">Games Played</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
              <p className="text-3xl font-bold text-purple-600">{allPlayers.length}</p>
              <p className="text-xs text-purple-700 font-semibold mt-1">Players</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
              <p className="text-3xl font-bold text-amber-600">{duration || '—'}</p>
              <p className="text-xs text-amber-700 font-semibold mt-1">Duration</p>
            </div>
          </div>

          {/* Session Info */}
          <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-slate-500 font-semibold">Date</p>
                <p className="text-slate-900 font-bold">
                  {session ? formatDateString(session.date) : '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold">Location</p>
                <p className="text-slate-900 font-bold">
                  {session?.location || 'No location'}
                </p>
              </div>
            </div>
          </div>

          {/* Top Performer */}
          {topPerformer && topPerformer.gamesPlayed > 0 && (
            <div className={`p-4 bg-gradient-to-r ${topPerformer.winRate === 100 ? 'from-sky-200 via-cyan-50 to-sky-200 border-cyan-300' : 'from-yellow-400 to-amber-400 border-yellow-500'} rounded-xl border-2`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-bold ${topPerformer.winRate === 100 ? 'text-slate-900' : 'text-amber-900'} uppercase tracking-wide`}>
                    🏆 Top Performer
                  </p>
                  <p className={`text-xl font-bold ${topPerformer.winRate === 100 ? 'text-slate-900' : 'text-amber-900'} mt-1`}>
                    {topPerformer.name}
                  </p>
                  <p className={`text-sm ${topPerformer.winRate === 100 ? 'text-slate-900' : 'text-amber-800'} font-semibold`}>
                    {topPerformer.gamesWon}-{topPerformer.gamesPlayed - topPerformer.gamesWon} ({topPerformer.winRate}% win rate)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Player Stats */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-700">Player Summary</h3>
            <div className="max-h-64 overflow-y-auto space-y-2 p-2 bg-slate-50 rounded-xl border-2 border-slate-200">
              {allPlayers.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No player data</p>
              ) : (
                allPlayers.map((player, index) => (
                  <div
                    key={player.name}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border-2 border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-bold text-sm">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{player.name}</p>
                        <p className="text-xs text-slate-500">
                          {player.gamesWon}W - {player.gamesPlayed - player.gamesWon}L
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-700">
                        {player.winRate}%
                      </p>
                      <p className="text-xs text-slate-500">
                        {player.gamesPlayed} {player.gamesPlayed === 1 ? 'game' : 'games'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Warning */}
          {games.length === 0 ? (
            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <p className="text-amber-700 font-semibold text-sm">
                ⚠️ No games have been played yet. Ending now will save an empty session.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
              <p className="text-green-700 font-semibold text-sm">
                ✓ This session will be saved and added to your session history.
              </p>
              <p className="text-green-600 text-xs mt-1">
                Game-by-game data will be preserved for future analytics.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className="w-full px-5 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all"
            >
              Save & End Session
            </button>
            <button
              onClick={onClose}
              className="w-full px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
            >
              Continue Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndSessionModal;
