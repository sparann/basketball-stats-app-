import { useState } from 'react';

const WinnerButtons = ({ onWinnerSelected, disabled, teamASize, teamBSize }) => {
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isTeamSizeValid = teamASize > 0 && teamASize === teamBSize;

  const handleWinnerClick = async (team) => {
    if (disabled || isProcessing || !isTeamSizeValid) return;

    setSelectedWinner(team);
    setIsProcessing(true);

    try {
      // Haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      await onWinnerSelected(team);
    } catch (error) {
      console.error('Error marking winner:', error);
      setSelectedWinner(null);
    } finally {
      setIsProcessing(false);
      setSelectedWinner(null);
    }
  };

  if (!isTeamSizeValid) {
    return (
      <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl text-center">
        <p className="text-amber-700 font-semibold">
          Teams must be equal size to start a game
        </p>
        <p className="text-amber-600 text-sm mt-1">
          Team A: {teamASize} players • Team B: {teamBSize} players
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => handleWinnerClick('team_a')}
        disabled={disabled || isProcessing || !isTeamSizeValid}
        className={`relative px-6 py-6 rounded-2xl font-bold text-lg transition-all shadow-lg
          ${selectedWinner === 'team_a' || isProcessing
            ? 'bg-blue-500 text-white scale-95'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:scale-105 active:scale-95'
          }
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
      >
        {isProcessing && selectedWinner === 'team_a' ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </span>
        ) : (
          <>
            <div className="text-2xl mb-1">🏀</div>
            TEAM A WON
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => handleWinnerClick('team_b')}
        disabled={disabled || isProcessing || !isTeamSizeValid}
        className={`relative px-6 py-6 rounded-2xl font-bold text-lg transition-all shadow-lg
          ${selectedWinner === 'team_b' || isProcessing
            ? 'bg-red-500 text-white scale-95'
            : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:shadow-xl hover:scale-105 active:scale-95'
          }
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
      >
        {isProcessing && selectedWinner === 'team_b' ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </span>
        ) : (
          <>
            <div className="text-2xl mb-1">🏀</div>
            TEAM B WON
          </>
        )}
      </button>
    </div>
  );
};

export default WinnerButtons;
