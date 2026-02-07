import { useEffect, useMemo } from 'react';
import { useLiveSession } from './LiveSessionContext';

const StandingsModal = ({ onClose }) => {
  const { players } = useLiveSession();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Combine all players and calculate standings
  const standings = useMemo(() => {
    const allPlayers = [...players.teamA, ...players.teamB, ...players.sittingOut];

    return allPlayers
      .map(player => ({
        name: player.name,
        gamesPlayed: player.gamesPlayed,
        gamesWon: player.gamesWon,
        gamesLost: player.gamesPlayed - player.gamesWon,
        winRate: player.gamesPlayed > 0
          ? Math.round((player.gamesWon / player.gamesPlayed) * 100)
          : 0
      }))
      .sort((a, b) => {
        // Sort by win rate, then by games won
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.gamesWon - a.gamesWon;
      });
  }, [players]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-600 to-indigo-600">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Player Standings</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-100 text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-2">
            {standings.map((player, index) => {
              const isFirstPlace = index === 0;
              const isPerfect = isFirstPlace && player.winRate === 100;
              const bgClass = isFirstPlace
                ? isPerfect
                  ? 'bg-gradient-to-r from-sky-200 via-cyan-50 to-sky-200 border-2 border-cyan-300'
                  : 'bg-gradient-to-r from-yellow-400 to-amber-400 border-2 border-yellow-500'
                : 'bg-slate-50 border-2 border-slate-200';
              const rankColor = isPerfect ? 'text-slate-900' : isFirstPlace ? 'text-amber-900' : 'text-slate-400';
              const nameColor = isPerfect ? 'text-slate-900' : isFirstPlace ? 'text-amber-900' : 'text-slate-900';
              const recordColor = isPerfect ? 'text-slate-900' : isFirstPlace ? 'text-amber-800' : 'text-slate-500';
              const rateColor = isPerfect ? 'text-slate-900' : isFirstPlace ? 'text-amber-900' : 'text-slate-700';
              const gamesColor = isPerfect ? 'text-slate-900' : isFirstPlace ? 'text-amber-800' : 'text-slate-500';

              return (
                <div
                  key={player.name}
                  className={`flex items-center justify-between p-4 rounded-xl ${bgClass}`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-bold ${rankColor}`}>
                      #{index + 1}
                    </span>
                    <div>
                      <p className={`font-bold ${nameColor}`}>
                        {player.name}
                      </p>
                      <p className={`text-sm ${recordColor}`}>
                        {player.gamesWon}W - {player.gamesLost}L
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${rateColor}`}>
                      {player.winRate}%
                    </p>
                    <p className={`text-xs ${gamesColor}`}>
                      {player.gamesPlayed} {player.gamesPlayed === 1 ? 'game' : 'games'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StandingsModal;
