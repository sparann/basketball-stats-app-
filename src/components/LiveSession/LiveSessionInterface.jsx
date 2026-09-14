import { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveSession } from './LiveSessionContext';
import InitialTeamSetupWizard from './InitialTeamSetupWizard';
import SimpleRotationFlow from './SimpleRotationFlow';
import EndSessionModal from './EndSessionModal';
import AddPlayerModal from './AddPlayerModal';
import { formatDateString } from '../../utils/dateFormatter';
import { useUI } from '../../context/ui-context';

const LiveSessionInterface = ({ onExit, startWithEndModal = false }) => {
  const { session, players, gameNumber, games, actions, isLoading, getWinStreak } = useLiveSession();
  const { toast, confirm } = useUI();
  const [setupRequested, setSetupRequested] = useState(false);
  const [showPostGameFlow, setShowPostGameFlow] = useState(false);
  // "Finish & Save" on an unfinished session opens straight into the summary
  const [showEndModal, setShowEndModal] = useState(Boolean(startWithEndModal));
  const wakeLockRef = useRef(null);
  const [showStandings, setShowStandings] = useState(false);
  const [showAllGames, setShowAllGames] = useState(false);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'between_games', 'setup'
  const [lastGameResult, setLastGameResult] = useState(null);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);

  // Keep the screen on for the whole session. Browsers drop the lock when the
  // tab is hidden, so re-request it when the tab comes back.
  useEffect(() => {
    if (!('wakeLock' in navigator)) return undefined;

    let cancelled = false;

    const requestWakeLock = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          lock.release();
          return;
        }
        lock.addEventListener('release', () => {
          if (wakeLockRef.current === lock) wakeLockRef.current = null;
        });
        wakeLockRef.current = lock;
      } catch (err) {
        console.warn('Wake lock unavailable:', err);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) {
        requestWakeLock();
      }
    };

    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, []);

  // The team-setup wizard shows until both teams have players, or when a reshoot is requested
  const teamsAreSet = players.teamA.length > 0 && players.teamB.length > 0;
  const showInitialSetup = setupRequested || !teamsAreSet;

  const handleInitialSetupComplete = useCallback(() => {
    setSetupRequested(false);
    setGameState('playing');
  }, []);

  const handleWinnerSelected = useCallback(async (winningTeam) => {
    try {
      await actions.markWinner(winningTeam);
      setLastGameResult({
        gameNumber: gameNumber,
        winningTeam: winningTeam,
        losingTeam: winningTeam === 'team_a' ? 'team_b' : 'team_a',
        timestamp: new Date()
      });
      setGameState('between_games');
    } catch (error) {
      toast(`Couldn't save that game: ${error.message}`, { type: 'error' });
    }
  }, [actions, gameNumber, toast]);

  const handlePostGameComplete = useCallback(() => {
    setShowPostGameFlow(false);
    setGameState('playing');
    setLastGameResult(null);
  }, []);

  // With nobody on the bench the roster can't rotate, so skip the rotation
  // screen and run it back. Reshoot stays available for switching teams up.
  const noBench = players.sittingOut.length === 0;

  const handleStartNextGame = useCallback(() => {
    if (noBench) {
      setGameState('playing');
      setLastGameResult(null);
      return;
    }
    setShowPostGameFlow(true);
  }, [noBench]);

  const handleCancelPostGameFlow = useCallback(() => {
    setShowPostGameFlow(false);
  }, []);

  const handleEndSession = useCallback(async () => {
    try {
      await actions.endSession();
      if (onExit) onExit();
    } catch (error) {
      toast(`Couldn't end the session: ${error.message}. Your games are saved, try again.`, { type: 'error', duration: 6000 });
    }
  }, [actions, onExit, toast]);

  const handleExit = useCallback(async () => {
    if (games.length > 0) {
      const ok = await confirm({
        title: 'Pause this session?',
        message: 'Your games are saved. The session stays active and you can resume it from Admin.',
        confirmLabel: 'Pause'
      });
      if (ok && onExit) onExit();
    } else if (onExit) {
      onExit();
    }
  }, [games, onExit, confirm]);

  const handleUndoLastGame = useCallback(async () => {
    if (games.length === 0) return;

    const ok = await confirm({
      title: `Undo game ${games.length}?`,
      message: 'The result is removed and the teams go back to how they were for that game.',
      confirmLabel: 'Undo',
      destructive: true
    });
    if (!ok) return;

    try {
      await actions.undoLastGame();
      toast(`Game ${games.length} undone`);
    } catch (error) {
      toast(`Couldn't undo: ${error.message}`, { type: 'error' });
    }
  }, [actions, games, confirm, toast]);

  const handleReshootTeams = useCallback(() => {
    setShowPostGameFlow(false);
    setSetupRequested(true);
    setGameState('setup');
    setLastGameResult(null);
  }, []);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-2">
        <div className="text-center">
          <p className="text-ink-2 font-semibold">No active session</p>
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
    <div className="fixed inset-0 z-40 bg-court overflow-y-auto">
      {/* Header */}
      <div className="bg-surface border-b-2 border-line shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <button
              onClick={handleExit}
              className="text-ink font-semibold text-sm hover:text-ink transition-colors"
            >
              ← Pause
            </button>

            <div className="text-center">
              <h1 className="text-base font-bold text-ink">
                Game {gameNumber}
              </h1>
              <p className="text-xs text-ink-2">
                {formatDateString(session.date)}
                {session.location && ` • ${session.location}`}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAddPlayerModal(true)}
                className="w-8 h-8 flex items-center justify-center bg-surface-2 text-ink rounded-lg font-bold text-lg hover:bg-line-strong transition-colors"
                title="Add new player"
              >
                +
              </button>
              {games.length > 0 && (
                <button
                  onClick={handleUndoLastGame}
                  className="w-8 h-8 flex items-center justify-center bg-amber-100 text-ink-2 rounded-lg font-bold text-sm hover:bg-amber-200 transition-colors"
                  title="Undo last game"
                >
                  ↶
                </button>
              )}
              <button
                onClick={() => setShowEndModal(true)}
                className="px-3 py-2 bg-accent text-accent-ink rounded-lg font-semibold text-xs hover:brightness-110 transition-colors"
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
              <div className="bg-surface rounded-xl border-2 border-line p-5 w-full">
                {/* Game Status & Actions */}
                <div className="mb-5">
                  {gameState === 'playing' && (
                    <>
                      <h3 className="text-center font-bold text-ink mb-3">
                        Game {gameNumber} - In Progress
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => handleWinnerSelected('team_a')}
                          disabled={isLoading}
                          className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-40"
                        >
                          TEAM A WON
                        </button>
                        <button
                          onClick={() => handleWinnerSelected('team_b')}
                          disabled={isLoading}
                          className="px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-40"
                        >
                          TEAM B WON
                        </button>
                      </div>
                    </>
                  )}

                  {gameState === 'between_games' && lastGameResult && (
                    <>
                      <div className="text-center mb-3">
                        <p className="text-ink-2 text-sm font-semibold mb-1">Game {lastGameResult.gameNumber} Complete</p>
                        <h3 className={`text-2xl font-bold ${
                          lastGameResult.winningTeam === 'team_a' ? 'text-blue-400' : 'text-red-400'
                        }`}>
                          {lastGameResult.winningTeam === 'team_a' ? 'Team A' : 'Team B'} Wins!
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          onClick={handleStartNextGame}
                          className="px-4 py-4 bg-accent text-accent-ink rounded-xl font-bold text-base hover:shadow-lg transition-all"
                        >
                          {noBench ? 'Next Game · Same Teams' : 'Next Game'}
                        </button>
                        <button
                          onClick={handleReshootTeams}
                          className="px-4 py-4 bg-surface-2 text-ink rounded-xl font-bold text-base hover:bg-line-strong transition-colors"
                        >
                          Reshoot
                        </button>
                        <button
                          onClick={() => setShowEndModal(true)}
                          className="px-4 py-4 bg-surface-2 text-ink rounded-xl font-bold text-base hover:bg-line-strong transition-colors"
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
                    <div className="bg-blue-950/60 px-4 py-3 rounded-t-xl border-l-4 border-blue-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-ink font-bold text-base">
                            Team A {getWinStreak('team_a') >= 3 && '🔥'}
                          </h3>
                          <p className="text-ink-2 text-xs mt-0.5">
                            {players.teamA.length} players
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-surface border border-line border-t-0 rounded-b-xl p-4 space-y-2.5">
                      {players.teamA.map((player) => (
                        <div key={player.name} className="p-3 bg-surface-2 rounded-lg">
                          <p className="font-semibold text-sm text-ink">{player.name}</p>
                          <p className="text-xs text-ink-2">{player.gamesWon}-{player.gamesPlayed - player.gamesWon}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Team B */}
                  <div>
                    <div className="bg-red-950/60 px-4 py-3 rounded-t-xl border-l-4 border-red-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-ink font-bold text-base">
                            Team B {getWinStreak('team_b') >= 3 && '🔥'}
                          </h3>
                          <p className="text-ink-2 text-xs mt-0.5">
                            {players.teamB.length} players
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-surface border border-line border-t-0 rounded-b-xl p-4 space-y-2.5">
                      {players.teamB.map((player) => (
                        <div key={player.name} className="p-3 bg-surface-2 rounded-lg">
                          <p className="font-semibold text-sm text-ink">{player.name}</p>
                          <p className="text-xs text-ink-2">{player.gamesWon}-{player.gamesPlayed - player.gamesWon}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bench */}
                <div>
                  <div className="bg-surface-2 px-4 py-3 rounded-t-xl border-l-4 border-line-strong">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-ink font-bold text-base">Bench</h3>
                        <p className="text-ink-2 text-xs mt-0.5">
                          {players.sittingOut.length} {players.sittingOut.length === 1 ? 'player' : 'players'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-surface border border-line border-t-0 rounded-b-xl p-4">
                    {players.sittingOut.length === 0 ? (
                      <p className="text-center text-ink-3 text-sm py-4">All players on teams</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {players.sittingOut.map((player) => (
                          <div key={player.name} className="p-3 bg-surface-2 rounded-lg">
                            <p className="font-semibold text-sm text-ink">{player.name}</p>
                            <p className="text-xs text-ink-2">{player.gamesWon}-{player.gamesPlayed - player.gamesWon}</p>
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
                <div className="bg-surface rounded-xl border-2 border-line p-4">
                  <h3 className="font-bold text-ink mb-3">Session Stats</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-ink-2">Games Played</p>
                      <p className="text-2xl font-bold text-ink">{games.length}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-ink-2">Team A Record</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {games.filter(g => g.winning_team === 'team_a').length}-{games.filter(g => g.winning_team === 'team_b').length}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-ink-2">Team B Record</p>
                      <p className="text-2xl font-bold text-red-400">
                        {games.filter(g => g.winning_team === 'team_b').length}-{games.filter(g => g.winning_team === 'team_a').length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Games Card */}
              {games.length > 0 && (
                <div className="bg-surface rounded-xl border-2 border-line p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-ink">Recent Games</h3>
                    <button
                      onClick={() => setShowAllGames(true)}
                      className="w-7 h-7 flex items-center justify-center text-ink-2 hover:bg-surface-2 rounded-lg transition-colors text-xl font-bold"
                    >
                      +
                    </button>
                  </div>
                  <div className="space-y-2">
                    {games.slice().reverse().slice(0, 3).map((game) => (
                      <div key={game.id} className="flex items-center justify-between p-2.5 bg-surface-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-ink-3">
                            Game {game.game_number}
                          </span>
                          <span className={`text-sm font-bold ${
                            game.winning_team === 'team_a' ? 'text-blue-400' : 'text-red-400'
                          }`}>
                            {game.winning_team === 'team_a' ? 'Team A' : 'Team B'}
                          </span>
                        </div>
                        <span className="text-xs text-ink-3">
                          {new Date(game.played_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Player Standings Card */}
              {games.length > 0 && (
                <div className="bg-surface rounded-xl border-2 border-line p-4 flex flex-col flex-1 min-h-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-ink">Player Standings</h3>
                    <button
                      onClick={() => setShowStandings(true)}
                      className="w-7 h-7 flex items-center justify-center text-ink-2 hover:bg-surface-2 rounded-lg transition-colors text-xl font-bold"
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
                            className="flex items-center justify-between p-2.5 rounded-lg bg-surface-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-ink-3">
                                #{index + 1}
                              </span>
                              <div>
                                <p className="font-bold text-sm text-ink">
                                  {player.name}
                                </p>
                                <p className="text-xs text-ink-2">
                                  {player.gamesWon}W - {player.gamesPlayed - player.gamesWon}L
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-ink">
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

      {showPostGameFlow && lastGameResult && (
        <SimpleRotationFlow
          winningTeam={lastGameResult.winningTeam}
          losingTeam={lastGameResult.losingTeam}
          onComplete={handlePostGameComplete}
          onCancel={handleCancelPostGameFlow}
        />
      )}

      {showEndModal && (
        <EndSessionModal
          onClose={() => setShowEndModal(false)}
          onConfirm={handleEndSession}
        />
      )}

      {showAddPlayerModal && (
        <AddPlayerModal
          onClose={() => setShowAddPlayerModal(false)}
        />
      )}

      {/* Player Standings Modal */}
      {showStandings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-line flex items-center justify-between bg-surface-2">
              <h2 className="text-xl font-bold text-ink">Player Standings</h2>
              <button
                onClick={() => setShowStandings(false)}
                className="w-8 h-8 flex items-center justify-center text-ink-2 hover:bg-line-strong rounded-lg transition-colors"
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
                        className="flex items-center justify-between p-3 rounded-lg bg-surface-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold text-ink-3">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-bold text-sm text-ink">
                              {player.name}
                            </p>
                            <p className="text-xs text-ink-2">
                              {player.gamesWon}W - {player.gamesPlayed - player.gamesWon}L • {player.gamesPlayed} games
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-ink">
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
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-line flex items-center justify-between bg-surface-2">
              <h2 className="text-xl font-bold text-ink">All Games</h2>
              <button
                onClick={() => setShowAllGames(false)}
                className="w-8 h-8 flex items-center justify-center text-ink-2 hover:bg-line-strong rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <div className="space-y-2">
                {games.slice().reverse().map((game) => (
                  <div key={game.id} className="p-3 bg-surface-2 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-ink-3">
                        Game {game.game_number}
                      </span>
                      <span className="text-xs text-ink-3">
                        {new Date(game.played_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`text-base font-bold ${
                      game.winning_team === 'team_a' ? 'text-blue-400' : 'text-red-400'
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
