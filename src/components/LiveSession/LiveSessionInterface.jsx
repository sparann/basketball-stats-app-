import { useState, useEffect, useCallback } from 'react';
import { useLiveSession } from './LiveSessionContext';
import TeamColumn from './TeamColumn';
import WinnerButtons from './WinnerButtons';
import InitialTeamSetupWizard from './InitialTeamSetupWizard';
import PostGameFlow from './PostGameFlow';
import EndSessionModal from './EndSessionModal';
import { formatDateString } from '../../utils/dateFormatter';

const LiveSessionInterface = ({ onExit }) => {
  const { session, players, gameNumber, games, actions, isLoading, getWinStreak } = useLiveSession();
  const [showInitialSetup, setShowInitialSetup] = useState(true);
  const [showPostGameFlow, setShowPostGameFlow] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [lastWinner, setLastWinner] = useState(null);
  const [wakeLock, setWakeLock] = useState(null);
  const [showStandings, setShowStandings] = useState(false);
  const [showAllGames, setShowAllGames] = useState(false);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'between_games', 'setup'
  const [lastGameResult, setLastGameResult] = useState(null);

  // Request wake lock to keep screen on
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          const lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
          console.log('Wake lock acquired');
        }
      } catch (err) {
        console.log('Wake lock error:', err);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLock) {
        wakeLock.release();
        console.log('Wake lock released');
      }
    };
  }, []);

  // Check if teams are set up
  useEffect(() => {
    if (players.teamA.length > 0 && players.teamB.length > 0) {
      setShowInitialSetup(false);
    }
  }, [players]);

  const handleInitialSetupComplete = useCallback(() => {
    setShowInitialSetup(false);
    setGameState('playing');
  }, []);

  const handleWinnerSelected = useCallback(async (winningTeam) => {
    try {
      const result = await actions.markWinner(winningTeam);
      setLastWinner(result);
      setLastGameResult({
        gameNumber: gameNumber,
        winningTeam: winningTeam,
        timestamp: new Date()
      });
      setGameState('between_games');
    } catch (error) {
      alert(`Error marking winner: ${error.message}`);
    }
  }, [actions, gameNumber]);

  const handlePostGameComplete = useCallback(() => {
    setShowPostGameFlow(false);
    setLastWinner(null);
    setGameState('playing');
    setLastGameResult(null);
  }, []);

  const handleStartNextGame = useCallback(() => {
    setShowPostGameFlow(true);
  }, []);

  const handleCancelPostGameFlow = useCallback(() => {
    setShowPostGameFlow(false);
  }, []);

  const handleNoMoreGames = useCallback(() => {
    setShowPostGameFlow(false);
    setShowEndModal(true);
  }, []);

  const handleEndSession = useCallback(async () => {
    try {
      await actions.endSession();
      if (onExit) onExit();
    } catch (error) {
      alert(`Error ending session: ${error.message}\n\nYour game data is safe. Please try again or contact support.`);
    }
  }, [actions, onExit]);

  const handleExit = useCallback(() => {
    if (games.length > 0) {
      const confirmed = window.confirm(
        'You have games recorded in this session. Do you want to exit? The session will remain active and you can resume it later.'
      );
      if (confirmed && onExit) onExit();
    } else {
      if (onExit) onExit();
    }
  }, [games, onExit]);

  const handleUndoLastGame = useCallback(async () => {
    if (games.length === 0) return;

    const confirmed = window.confirm(
      'Are you sure you want to undo the last game? This will revert all stats and rosters.'
    );

    if (confirmed) {
      try {
        await actions.undoLastGame();
        alert('Last game undone successfully');
      } catch (error) {
        alert(`Error undoing game: ${error.message}`);
      }
    }
  }, [actions, games]);

  const handleReshootTeams = useCallback(() => {
    setShowPostGameFlow(false);
    setShowInitialSetup(true);
    setGameState('setup');
    setLastGameResult(null);
  }, []);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-center">
          <p className="text-slate-600 font-semibold">No active session</p>
          <button
            onClick={onExit}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b-2 border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <button
              onClick={handleExit}
              className="text-slate-700 font-semibold text-sm hover:text-slate-900 transition-colors"
            >
              ← Exit
            </button>

            <div className="text-center">
              <h1 className="text-base font-bold text-slate-900">
                Game {gameNumber}
              </h1>
              <p className="text-xs text-slate-500">
                {formatDateString(session.date)}
                {session.location && ` • ${session.location}`}
              </p>
            </div>

            <div className="flex gap-2">
              {games.length > 0 && (
                <button
                  onClick={handleUndoLastGame}
                  className="w-8 h-8 flex items-center justify-center bg-amber-100 text-amber-700 rounded-lg font-bold text-sm hover:bg-amber-200 transition-colors"
                  title="Undo last game"
                >
                  ↶
                </button>
              )}
              <button
                onClick={() => setShowEndModal(true)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg font-semibold text-xs hover:bg-green-700 transition-colors"
              >
                End
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {!showInitialSetup && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:items-stretch">
            {/* Left: Main Game Card - Teams + Status + Actions */}
            <div className="lg:col-span-2 flex">
              <div className="bg-white rounded-xl border-2 border-slate-200 p-5 w-full">
                {/* Game Status & Actions */}
                <div className="mb-5">
                  {gameState === 'playing' && (
                    <>
                      <h3 className="text-center font-bold text-slate-900 mb-3">
                        Game {gameNumber} - In Progress
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => handleWinnerSelected('team_a')}
                          disabled={isLoading}
                          className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-40"
                        >
                          🏀 TEAM A WON
                        </button>
                        <button
                          onClick={() => handleWinnerSelected('team_b')}
                          disabled={isLoading}
                          className="px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-40"
                        >
                          🏀 TEAM B WON
                        </button>
                      </div>
                    </>
                  )}

                  {gameState === 'between_games' && lastGameResult && (
                    <>
                      <div className="text-center mb-3">
                        <p className="text-slate-600 text-sm font-semibold mb-1">Game {lastGameResult.gameNumber} Complete</p>
                        <h3 className={`text-2xl font-bold ${
                          lastGameResult.winningTeam === 'team_a' ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {lastGameResult.winningTeam === 'team_a' ? 'Team A' : 'Team B'} Wins!
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          onClick={handleStartNextGame}
                          className="px-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-base hover:shadow-lg transition-all"
                        >
                          Next Game
                        </button>
                        <button
                          onClick={handleReshootTeams}
                          className="px-4 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold text-base hover:bg-slate-200 transition-colors"
                        >
                          Reshoot
                        </button>
                        <button
                          onClick={() => setShowEndModal(true)}
                          className="px-4 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold text-base hover:bg-slate-200 transition-colors"
                        >
                          End
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Teams Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Team A */}
                  <div>
                    <div className="bg-blue-100 px-4 py-3 rounded-t-xl border-l-4 border-blue-600">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-slate-900 font-bold text-base">
                            Team A {getWinStreak('team_a') >= 3 && '🔥'}
                          </h3>
                          <p className="text-slate-600 text-xs mt-0.5">
                            {players.teamA.length} players
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 border-t-0 rounded-b-xl p-4 space-y-2.5">
                      {players.teamA.map((player) => (
                        <div key={player.name} className="p-3 bg-slate-50 rounded-lg">
                          <p className="font-semibold text-sm text-slate-900">{player.name}</p>
                          <p className="text-xs text-slate-500">{player.gamesWon}-{player.gamesPlayed - player.gamesWon}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Team B */}
                  <div>
                    <div className="bg-red-100 px-4 py-3 rounded-t-xl border-l-4 border-red-600">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-slate-900 font-bold text-base">
                            Team B {getWinStreak('team_b') >= 3 && '🔥'}
                          </h3>
                          <p className="text-slate-600 text-xs mt-0.5">
                            {players.teamB.length} players
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 border-t-0 rounded-b-xl p-4 space-y-2.5">
                      {players.teamB.map((player) => (
                        <div key={player.name} className="p-3 bg-slate-50 rounded-lg">
                          <p className="font-semibold text-sm text-slate-900">{player.name}</p>
                          <p className="text-xs text-slate-500">{player.gamesWon}-{player.gamesPlayed - player.gamesWon}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bench */}
                <div>
                  <div className="bg-slate-200 px-4 py-3 rounded-t-xl border-l-4 border-slate-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-slate-900 font-bold text-base">Bench</h3>
                        <p className="text-slate-600 text-xs mt-0.5">
                          {players.sittingOut.length} {players.sittingOut.length === 1 ? 'player' : 'players'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 border-t-0 rounded-b-xl p-4">
                    {players.sittingOut.length === 0 ? (
                      <p className="text-center text-slate-400 text-sm py-4">All players on teams</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {players.sittingOut.map((player) => (
                          <div key={player.name} className="p-3 bg-slate-50 rounded-lg">
                            <p className="font-semibold text-sm text-slate-900">{player.name}</p>
                            <p className="text-xs text-slate-500">{player.gamesWon}-{player.gamesPlayed - player.gamesWon}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Dashboard Cards Stacked */}
            <div className="flex flex-col space-y-4 h-full">

              {/* Session Stats Card */}
              {games.length > 0 && (
                <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
                  <h3 className="font-bold text-slate-900 mb-3">Session Stats</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600">Games Played</p>
                      <p className="text-2xl font-bold text-slate-900">{games.length}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600">Team A Record</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {games.filter(g => g.winning_team === 'team_a').length}-{games.filter(g => g.winning_team === 'team_b').length}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600">Team B Record</p>
                      <p className="text-2xl font-bold text-red-600">
                        {games.filter(g => g.winning_team === 'team_b').length}-{games.filter(g => g.winning_team === 'team_a').length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Games Card */}
              {games.length > 0 && (
                <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900">Recent Games</h3>
                    <button
                      onClick={() => setShowAllGames(true)}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-xl font-bold"
                    >
                      +
                    </button>
                  </div>
                  <div className="space-y-2">
                    {games.slice().reverse().slice(0, 3).map((game) => (
                      <div key={game.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">
                            Game {game.game_number}
                          </span>
                          <span className={`text-sm font-bold ${
                            game.winning_team === 'team_a' ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            {game.winning_team === 'team_a' ? 'Team A' : 'Team B'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(game.played_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Player Standings Card */}
              {games.length > 0 && (
                <div className="bg-white rounded-xl border-2 border-slate-200 p-4 flex flex-col flex-1 min-h-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900">Player Standings</h3>
                    <button
                      onClick={() => setShowStandings(true)}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-xl font-bold"
                    >
                      +
                    </button>
                  </div>

                  <div className="space-y-2 flex-1 flex flex-col justify-center">
                    {[...players.teamA, ...players.teamB, ...players.sittingOut]
                      .sort((a, b) => {
                        const aRate = a.gamesPlayed > 0 ? a.gamesWon / a.gamesPlayed : 0;
                        const bRate = b.gamesPlayed > 0 ? b.gamesWon / b.gamesPlayed : 0;
                        if (bRate !== aRate) return bRate - aRate;
                        return b.gamesWon - a.gamesWon;
                      })
                      .slice(0, 4)
                      .map((player, index) => {
                        const winRate = player.gamesPlayed > 0
                          ? Math.round((player.gamesWon / player.gamesPlayed) * 100)
                          : 0;
                        return (
                          <div
                            key={player.name}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-400">
                                #{index + 1}
                              </span>
                              <div>
                                <p className="font-bold text-sm text-slate-900">
                                  {player.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {player.gamesWon}W - {player.gamesPlayed - player.gamesWon}L
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-700">
                                {winRate}%
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showInitialSetup && (
        <InitialTeamSetupWizard onComplete={handleInitialSetupComplete} />
      )}

      {showPostGameFlow && lastWinner && (
        <PostGameFlow
          winningTeam={lastWinner.winningTeam}
          losingTeam={lastWinner.losingTeam}
          onComplete={handlePostGameComplete}
          onCancel={handleCancelPostGameFlow}
          onNoMoreGames={handleNoMoreGames}
          onReshootTeams={handleReshootTeams}
        />
      )}

      {showEndModal && (
        <EndSessionModal
          onClose={() => setShowEndModal(false)}
          onConfirm={handleEndSession}
        />
      )}

      {/* Player Standings Modal */}
      {showStandings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Player Standings</h2>
              <button
                onClick={() => setShowStandings(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <div className="space-y-2">
                {[...players.teamA, ...players.teamB, ...players.sittingOut]
                  .sort((a, b) => {
                    const aRate = a.gamesPlayed > 0 ? a.gamesWon / a.gamesPlayed : 0;
                    const bRate = b.gamesPlayed > 0 ? b.gamesWon / b.gamesPlayed : 0;
                    if (bRate !== aRate) return bRate - aRate;
                    return b.gamesWon - a.gamesWon;
                  })
                  .map((player, index) => {
                    const winRate = player.gamesPlayed > 0
                      ? Math.round((player.gamesWon / player.gamesPlayed) * 100)
                      : 0;
                    return (
                      <div
                        key={player.name}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold text-slate-400">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-bold text-sm text-slate-900">
                              {player.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {player.gamesWon}W - {player.gamesPlayed - player.gamesWon}L • {player.gamesPlayed} games
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-700">
                            {winRate}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Games Modal */}
      {showAllGames && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100">
              <h2 className="text-xl font-bold text-slate-900">All Games</h2>
              <button
                onClick={() => setShowAllGames(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <div className="space-y-2">
                {games.slice().reverse().map((game) => (
                  <div key={game.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-400">
                        Game {game.game_number}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(game.played_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`text-base font-bold ${
                      game.winning_team === 'team_a' ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {game.winning_team === 'team_a' ? 'Team A' : 'Team B'} Won
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSessionInterface;
