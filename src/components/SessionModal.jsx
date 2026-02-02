import {
  formatDate,
  formatWinPercentage,
  calculateWinPercentage,
  getWinPercentageColor
} from '../utils/calculations';

const SessionModal = ({ session, onClose }) => {
  if (!session) return null;

  // Calculate session stats
  const totalGames = session.players.reduce((sum, p) => sum + p.gamesPlayed, 0);
  const avgGamesPerPlayer = (totalGames / session.players.length).toFixed(1);

  const playersWithWinRate = session.players.map(p => ({
    ...p,
    winPercentage: calculateWinPercentage(p.gamesWon, p.gamesPlayed)
  })).sort((a, b) => b.winPercentage - a.winPercentage);

  const topPerformer = playersWithWinRate[0];
  const avgWinRate = playersWithWinRate.reduce((sum, p) => sum + p.winPercentage, 0) / playersWithWinRate.length;

  const getGradientColor = (color) => {
    if (color === 'success') return 'from-green-600 to-emerald-600';
    if (color === 'warning') return 'from-amber-600 to-orange-600';
    return 'from-blue-600 to-indigo-600';
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">{formatDate(session.date)}</h2>
              {session.location && (
                <p className="text-slate-600 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {session.location}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Session Statistics */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Session Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Games</p>
              <p className="text-3xl font-bold text-slate-900">{totalGames}</p>
            </div>
            <div className="bg-white rounded-2xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Avg Games/Player</p>
              <p className="text-3xl font-bold text-slate-900">{avgGamesPerPlayer}</p>
            </div>
            <div className="bg-white rounded-2xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Players</p>
              <p className="text-3xl font-bold text-slate-900">{session.players.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Avg Win Rate</p>
              <p className="text-3xl font-bold text-slate-900">{formatWinPercentage(avgWinRate)}</p>
            </div>
          </div>
        </div>

        {/* Player Performance */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Player Performance</h3>
          <div className="space-y-3">
            {playersWithWinRate.map((player, index) => {
              const playerColor = getWinPercentageColor(player.winPercentage);
              const isTopPerformer = player.name === topPerformer.name;

              return (
                <div
                  key={player.name}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    isTopPerformer ? 'bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-blue-200' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getGradientColor(playerColor)} flex items-center justify-center text-white text-sm font-bold`}>
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 flex items-center gap-2">
                        {player.name}
                        {isTopPerformer && (
                          <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                            MVP
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500">
                        {player.gamesWon} wins out of {player.gamesPlayed} games
                      </p>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold bg-gradient-to-r ${getGradientColor(playerColor)} bg-clip-text text-transparent`}>
                    {formatWinPercentage(player.winPercentage)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          {playersWithWinRate.some(p => p.notes) && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Notes</h4>
              <div className="space-y-2">
                {playersWithWinRate.filter(p => p.notes).map((player) => (
                  <div key={player.name} className="text-sm">
                    <span className="font-semibold text-slate-900">{player.name}:</span>{' '}
                    <span className="text-slate-600 italic">{player.notes}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionModal;
