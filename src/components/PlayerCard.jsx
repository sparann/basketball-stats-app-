import {
  formatWinPercentage,
  getWinPercentageColor,
  formatDate,
  isPlayerActive
} from '../utils/calculations';

const PlayerCard = ({ player, rank, onClick }) => {
  const winPercentageColor = getWinPercentageColor(player.overallWinPercentage, player.totalGamesPlayed);
  const isActive = isPlayerActive(player.lastPlayed);

  const getGradientColor = (color) => {
    if (color === 'perfect') return 'from-yellow-400 via-amber-500 to-yellow-400';
    if (color === 'excellent') return 'from-green-600 to-emerald-600';
    if (color === 'good') return 'from-yellow-500 to-amber-500';
    if (color === 'fair') return 'from-orange-500 to-orange-600';
    if (color === 'poor') return 'from-red-600 to-red-700';
    if (color === 'default') return 'from-slate-600 to-slate-600';
    return 'from-blue-600 to-indigo-600';
  };

  const getBadgeColor = (color) => {
    if (color === 'perfect') return 'from-yellow-300 to-amber-500 shadow-lg shadow-yellow-300';
    if (color === 'excellent') return 'from-green-400 to-emerald-600';
    if (color === 'good') return 'from-yellow-400 to-amber-600';
    if (color === 'fair') return 'from-orange-400 to-orange-600';
    if (color === 'poor') return 'from-red-500 to-red-700';
    if (color === 'default') return 'from-slate-400 to-slate-600';
    return 'from-blue-400 to-indigo-600';
  };

  const getBarColor = (color) => {
    if (color === 'perfect') return 'from-yellow-400 to-amber-500';
    if (color === 'excellent') return 'from-green-600 to-emerald-500';
    if (color === 'good') return 'from-yellow-500 to-amber-500';
    if (color === 'fair') return 'from-orange-500 to-orange-600';
    if (color === 'poor') return 'from-red-600 to-red-700';
    if (color === 'default') return 'from-slate-600 to-slate-500';
    return 'from-blue-600 to-indigo-500';
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100 cursor-pointer"
    >
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0">
            {player.pictureUrl ? (
              <img
                src={player.pictureUrl}
                alt={player.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xl font-bold border-2 border-slate-100">
                {getInitials(player.name)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold text-slate-900 mb-1">{player.name}</h3>
            <div className="flex items-center gap-2">
              {player.injured ? (
                <div className="flex items-center gap-2" title="Player is currently injured">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                    Injured
                  </span>
                </div>
              ) : isActive ? (
                <div className="flex items-center gap-2" title="Played within the last 14 days">
                  <div className="w-2 h-2 bg-green-500 animate-pulse rounded-full"></div>
                  <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                    Active
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2" title="Hasn't played in over 14 days">
                  <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Away
                  </span>
                </div>
              )}
            </div>
          </div>
          {rank && (
            <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${getBadgeColor(winPercentageColor)} rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}>
              #{rank}
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className={`text-6xl font-extrabold bg-gradient-to-r ${getGradientColor(winPercentageColor)} bg-clip-text text-transparent mb-2 ${winPercentageColor === 'perfect' ? 'drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''}`}>
            {formatWinPercentage(player.overallWinPercentage, player.totalGamesPlayed)}
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Win Rate</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Games Played</p>
            <p className="text-3xl font-bold text-slate-900">{player.totalGamesPlayed}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Wins</p>
            <p className="text-3xl font-bold text-slate-900">{player.totalGamesWon}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-600">Total Sessions</span>
            <span className="text-sm font-bold text-slate-900">{player.sessionsAttended}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-600">Last Played</span>
            <span className="text-sm font-bold text-slate-900">{formatDate(player.lastPlayed)}</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-t border-slate-200">
        <div className="flex items-center gap-2 h-16">
          {player.sessions.slice(-5).map((session, index) => {
            const sessionColor = getWinPercentageColor(session.winPercentage, session.gamesPlayed);
            return (
              <div
                key={index}
                className="flex-1 bg-slate-200 rounded-lg h-full relative overflow-hidden"
                title={`${formatDate(session.date)}: ${formatWinPercentage(session.winPercentage, session.gamesPlayed)}`}
              >
                <div
                  className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getBarColor(sessionColor)} rounded-lg`}
                  style={{ height: `${session.winPercentage * 100}%` }}
                ></div>
              </div>
            );
          })}
        </div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-2">Recent Session Performance</p>
      </div>
    </div>
  );
};

export default PlayerCard;
