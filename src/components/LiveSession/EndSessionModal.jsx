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
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-line bg-accent">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">
              End Live Session
            </h2>
            <p className="text-accent-ink/80 text-sm mt-1">
              Review session summary before saving
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Session Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-surface-2 rounded-xl border-2 border-line">
              <p className="text-3xl font-bold text-ink">{games.length}</p>
              <p className="text-xs text-ink-2 font-semibold mt-1">Games Played</p>
            </div>
            <div className="text-center p-4 bg-surface-2 rounded-xl border-2 border-line">
              <p className="text-3xl font-bold text-ink">{allPlayers.length}</p>
              <p className="text-xs text-ink-2 font-semibold mt-1">Players</p>
            </div>
            <div className="text-center p-4 bg-surface-2 rounded-xl border-2 border-line">
              <p className="text-3xl font-bold text-ink">{duration || '—'}</p>
              <p className="text-xs text-ink-2 font-semibold mt-1">Duration</p>
            </div>
          </div>

          {/* Session Info */}
          <div className="p-4 bg-surface-2 rounded-xl border-2 border-line">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-ink-2 font-semibold">Date</p>
                <p className="text-ink font-bold">
                  {session ? formatDateString(session.date) : '—'}
                </p>
              </div>
              <div>
                <p className="text-ink-2 font-semibold">Location</p>
                <p className="text-ink font-bold">
                  {session?.location || 'No location'}
                </p>
              </div>
            </div>
          </div>

          {/* Top Performer */}
          {topPerformer && topPerformer.gamesPlayed > 0 && (
            <div className={`p-4 bg-gradient-to-r ${topPerformer.winRate === 100 ? 'from-accent to-accent border-accent' : 'from-accent to-accent border-accent'} rounded-xl border-2`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-bold text-accent-ink uppercase tracking-wide`}>
                    🏆 Top Performer
                  </p>
                  <p className={`text-xl font-bold text-accent-ink mt-1`}>
                    {topPerformer.name}
                  </p>
                  <p className={`text-sm text-accent-ink/80 font-semibold`}>
                    {topPerformer.gamesWon}-{topPerformer.gamesPlayed - topPerformer.gamesWon} ({topPerformer.winRate}% win rate)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Player Stats */}
          <div className="space-y-3">
            <h3 className="font-bold text-ink">Player Summary</h3>
            <div className="max-h-64 overflow-y-auto space-y-2 p-2 bg-surface-2 rounded-xl border-2 border-line">
              {allPlayers.length === 0 ? (
                <p className="text-ink-2 text-center py-4">No player data</p>
              ) : (
                allPlayers.map((player, index) => (
                  <div
                    key={player.name}
                    className="flex items-center justify-between p-3 bg-surface rounded-xl border-2 border-line"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-ink-3 font-bold text-sm">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-bold text-ink">{player.name}</p>
                        <p className="text-xs text-ink-2">
                          {player.gamesWon}W - {player.gamesPlayed - player.gamesWon}L
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-ink">
                        {player.winRate}%
                      </p>
                      <p className="text-xs text-ink-2">
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
            <div className="p-4 bg-accent-soft border-2 border-line-strong rounded-xl">
              <p className="text-ink-2 font-semibold text-sm">
                ⚠️ No games have been played yet. Ending now will save an empty session.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-accent-soft border-2 border-line-strong rounded-xl">
              <p className="text-accent font-semibold text-sm">
                ✓ This session will be saved and added to your session history.
              </p>
              <p className="text-accent text-xs mt-1">
                Game-by-game data will be preserved for future analytics.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className="w-full px-5 py-4 bg-accent text-accent-ink rounded-xl font-bold text-lg hover:shadow-lg transition-all"
            >
              Save & End Session
            </button>
            <button
              onClick={onClose}
              className="w-full px-5 py-3 bg-surface-2 text-ink rounded-xl font-semibold hover:bg-line-strong transition-colors"
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
