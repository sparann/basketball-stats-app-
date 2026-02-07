import { memo } from 'react';
import PlayerCard from './PlayerCard';

const TeamColumn = memo(({ title, players, color, record, onPlayerRemove, emptyMessage, winStreak }) => {
  const totalWins = players.reduce((sum, p) => sum + p.gamesWon, 0);
  const totalLosses = players.reduce((sum, p) => sum + (p.gamesPlayed - p.gamesWon), 0);

  const colorClasses = {
    blue: {
      bg: 'from-blue-600 to-indigo-600',
      border: 'border-blue-200',
      text: 'text-blue-600'
    },
    red: {
      bg: 'from-red-600 to-rose-600',
      border: 'border-red-200',
      text: 'text-red-600'
    },
    gray: {
      bg: 'from-slate-600 to-slate-700',
      border: 'border-slate-200',
      text: 'text-slate-600'
    }
  };

  const colors = colorClasses[color] || colorClasses.gray;

  return (
    <div className="flex-1 min-w-0">
      <div className={`bg-gradient-to-r ${colors.bg} rounded-2xl p-4 mb-3 shadow-lg`}>
        <h3 className="text-white font-bold text-lg text-center">
          {title} {winStreak >= 3 && <span className="ml-2">🔥</span>}
        </h3>
        {record !== undefined ? (
          <p className="text-white text-center text-sm mt-1 opacity-90">
            {record}
          </p>
        ) : players.length > 0 && (
          <p className="text-white text-center text-sm mt-1 opacity-90">
            {totalWins}-{totalLosses}
          </p>
        )}
        <p className="text-white text-center text-xs mt-1 opacity-75">
          {players.length} {players.length === 1 ? 'player' : 'players'}
          {winStreak >= 3 && ` • ${winStreak} win streak`}
        </p>
      </div>

      <div className="space-y-2 px-1">
        {players.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            {emptyMessage || 'No players'}
          </div>
        ) : (
          players.map((player) => (
            <PlayerCard
              key={player.name}
              player={player}
              onRemove={onPlayerRemove}
              compact={true}
            />
          ))
        )}
      </div>
    </div>
  );
});

TeamColumn.displayName = 'TeamColumn';

export default TeamColumn;
