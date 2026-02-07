import { memo } from 'react';

const PlayerCard = memo(({ player, isDraggable = false, onRemove, compact = false }) => {
  if (compact) {
    return (
      <div className="bg-white rounded-xl p-3 border-2 border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-bold text-slate-900 text-sm">{player.name}</p>
            <p className="text-xs text-slate-500">
              {player.gamesWon}-{player.gamesPlayed - player.gamesWon}
            </p>
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(player)}
              className="ml-2 w-7 h-7 flex items-center justify-center bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-slate-900">{player.name}</p>
          <p className="text-sm text-slate-500">
            Record: {player.gamesWon}-{player.gamesPlayed - player.gamesWon}
          </p>
          {player.gamesPlayed > 0 && (
            <p className="text-xs text-slate-400 mt-1">
              Win Rate: {Math.round((player.gamesWon / player.gamesPlayed) * 100)}%
            </p>
          )}
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(player)}
            className="ml-3 w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
});

PlayerCard.displayName = 'PlayerCard';

export default PlayerCard;
