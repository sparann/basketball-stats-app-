import { useState, useEffect } from 'react';
import { useLiveSession } from './LiveSessionContext';

const PostGameFlow = ({ winningTeam, losingTeam, onComplete, onCancel, onNoMoreGames, onReshootTeams }) => {
  const { players, gameNumber, actions } = useLiveSession();
  const [step, setStep] = useState('select-staying'); // 'select-staying' -> 'select-from-bench' -> 'confirm-roster'
  const [selectedStaying, setSelectedStaying] = useState(new Set());
  const [selectedFromBench, setSelectedFromBench] = useState(new Set());

  const losingTeamKey = losingTeam === 'team_a' ? 'teamA' : 'teamB';
  const winningTeamKey = winningTeam === 'team_a' ? 'teamA' : 'teamB';
  const losingTeamPlayers = players[losingTeamKey];
  const benchPlayers = players.sittingOut;
  const hasNoBench = benchPlayers.length === 0;

  // Dynamic team colors
  const teamColors = {
    team_a: {
      gradient: 'from-blue-600 to-indigo-600',
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-blue-600'
    },
    team_b: {
      gradient: 'from-red-600 to-rose-600',
      bg: 'bg-red-600',
      hover: 'hover:bg-red-700',
      text: 'text-red-600'
    }
  };

  const losingTeamColors = teamColors[losingTeam];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // If no bench, complete immediately
  useEffect(() => {
    if (hasNoBench) {
      onComplete();
    }
  }, [hasNoBench, onComplete]);

  const handleSelectStayingDone = () => {
    const targetTeamSize = players[winningTeamKey].length;
    const needToStay = targetTeamSize - benchPlayers.length;

    // If we have enough bench players to fill the team (16+ total players), allow proceeding with no selection
    // This means everyone rotates and we select the new team entirely from the bench
    if (needToStay <= 0 && selectedStaying.size === 0) {
      // Go to bench selection to pick who plays from the expanded bench
      setStep('select-from-bench');
      return;
    }

    if (selectedStaying.size === 0) {
      alert('Please select at least one player to stay on the team');
      return;
    }

    const needFromBench = targetTeamSize - selectedStaying.size;

    if (needFromBench < 0) {
      alert(`Too many players selected. Team needs ${targetTeamSize} players.`);
      return;
    }

    if (needFromBench === 0) {
      // Team is full, go straight to confirm
      setStep('confirm-roster');
      return;
    }

    // Need to select from bench
    setStep('select-from-bench');
  };

  const handleSelectFromBenchDone = () => {
    const targetTeamSize = players[winningTeamKey].length;
    // If no one is staying, we need to select the full team size from bench
    // Otherwise, we need to fill the remaining spots
    const needFromBench = selectedStaying.size === 0 ? targetTeamSize : targetTeamSize - selectedStaying.size;

    if (selectedFromBench.size !== needFromBench) {
      alert(`Please select ${needFromBench} ${needFromBench === 1 ? 'player' : 'players'} from the bench`);
      return;
    }

    setStep('confirm-roster');
  };

  const handleConfirmRoster = () => {
    // If no one is staying (16+ player scenario), fill team entirely from selected bench players
    if (selectedStaying.size === 0) {
      const playersJoining = benchPlayers.filter(p => selectedFromBench.has(p.name));
      const remainingBench = [
        ...benchPlayers.filter(p => !selectedFromBench.has(p.name)),
        ...losingTeamPlayers // All losing team players go to bench
      ];

      const newLosingTeam = playersJoining;

      // Update rosters
      if (losingTeam === 'team_a') {
        actions.updateRoster({
          teamA: newLosingTeam,
          teamB: players.teamB,
          sittingOut: remainingBench
        });
      } else {
        actions.updateRoster({
          teamA: players.teamA,
          teamB: newLosingTeam,
          sittingOut: remainingBench
        });
      }

      onComplete();
      return;
    }

    // Calculate new rosters (normal flow)
    const playersStaying = losingTeamPlayers.filter(p => selectedStaying.has(p.name));
    const playersSitting = losingTeamPlayers.filter(p => !selectedStaying.has(p.name));
    const playersJoining = benchPlayers.filter(p => selectedFromBench.has(p.name));
    const remainingBench = [
      ...benchPlayers.filter(p => !selectedFromBench.has(p.name)),
      ...playersSitting
    ];

    const newLosingTeam = [...playersStaying, ...playersJoining];

    // Update rosters
    if (losingTeam === 'team_a') {
      actions.updateRoster({
        teamA: newLosingTeam,
        teamB: players.teamB,
        sittingOut: remainingBench
      });
    } else {
      actions.updateRoster({
        teamA: players.teamA,
        teamB: newLosingTeam,
        sittingOut: remainingBench
      });
    }

    onComplete();
  };

  const getNewRoster = () => {
    // If no one is staying (16+ player scenario), use selected bench players only
    if (selectedStaying.size === 0) {
      return benchPlayers.filter(p => selectedFromBench.has(p.name));
    }

    const playersStaying = losingTeamPlayers.filter(p => selectedStaying.has(p.name));
    const playersJoining = benchPlayers.filter(p => selectedFromBench.has(p.name));
    return [...playersStaying, ...playersJoining];
  };

  const toggleStaying = (playerName) => {
    const newSelected = new Set(selectedStaying);
    if (newSelected.has(playerName)) {
      newSelected.delete(playerName);
    } else {
      newSelected.add(playerName);
    }
    setSelectedStaying(newSelected);
  };

  const toggleFromBench = (playerName) => {
    const newSelected = new Set(selectedFromBench);
    const targetTeamSize = players[winningTeamKey].length;
    // If no one is staying, we need to select the full team size
    const needFromBench = selectedStaying.size === 0 ? targetTeamSize : targetTeamSize - selectedStaying.size;

    if (newSelected.has(playerName)) {
      newSelected.delete(playerName);
    } else {
      // Limit selection to what's needed
      if (newSelected.size >= needFromBench) {
        alert(`You only need ${needFromBench} ${needFromBench === 1 ? 'player' : 'players'} from the bench`);
        return;
      }
      newSelected.add(playerName);
    }
    setSelectedFromBench(newSelected);
  };

  return (
    <div className="fixed inset-0 bg-slate-100 overflow-y-auto z-50">
      <div className="max-w-2xl mx-auto min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Select Who Stays */}
        {step === 'select-staying' && (
          <>
            <div className={`relative p-6 border-b border-slate-200 bg-gradient-to-r ${losingTeamColors.gradient}`}>
              <button
                onClick={onCancel}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                ✕
              </button>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">
                  {losingTeam === 'team_a' ? 'Team A' : 'Team B'} - Who Stays?
                </h2>
                <p className="text-white text-sm mt-1 opacity-90">
                  Select who stays on {losingTeam === 'team_a' ? 'Team A' : 'Team B'} for the next game
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="mb-4 p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-center">
                <p className="text-slate-700 font-semibold">
                  Need: {Math.max(0, players[winningTeamKey].length - benchPlayers.length - selectedStaying.size)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {losingTeamPlayers.map((player) => (
                  <button
                    key={player.name}
                    type="button"
                    onClick={() => toggleStaying(player.name)}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      selectedStaying.has(player.name)
                        ? `${losingTeamColors.bg} text-white shadow-md`
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <p className="font-bold">{player.name}</p>
                      {selectedStaying.has(player.name) && (
                        <span className="text-xl">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSelectStayingDone}
                  disabled={selectedStaying.size === 0 && (players[winningTeamKey].length - benchPlayers.length) > 0}
                  className={`flex-1 px-6 py-4 bg-gradient-to-r ${losingTeamColors.gradient} text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {/* Select From Bench */}
        {step === 'select-from-bench' && (
          <>
            <div className="relative p-6 border-b border-slate-200 bg-gradient-to-r from-slate-600 to-slate-700">
              <button
                onClick={onCancel}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                ✕
              </button>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">
                  {selectedStaying.size === 0 ? 'Select New Team' : `Who Joins ${losingTeam === 'team_a' ? 'Team A' : 'Team B'}?`}
                </h2>
                <p className="text-white text-sm mt-1 opacity-90">
                  Select {selectedStaying.size === 0 ? players[winningTeamKey].length : players[winningTeamKey].length - selectedStaying.size} from the bench
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="mb-4 p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-center">
                <p className="text-slate-700 font-semibold">
                  {selectedFromBench.size} of {selectedStaying.size === 0 ? players[winningTeamKey].length : players[winningTeamKey].length - selectedStaying.size} selected
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {benchPlayers.map((player) => (
                  <button
                    key={player.name}
                    type="button"
                    onClick={() => toggleFromBench(player.name)}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      selectedFromBench.has(player.name)
                        ? 'bg-slate-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <p className="font-bold">{player.name}</p>
                      {selectedFromBench.has(player.name) && (
                        <span className="text-xl">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('select-staying')}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSelectFromBenchDone}
                  disabled={selectedFromBench.size !== (selectedStaying.size === 0 ? players[winningTeamKey].length : players[winningTeamKey].length - selectedStaying.size)}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next: Confirm Teams
                </button>
              </div>
            </div>
          </>
        )}

        {/* Confirm Roster */}
        {step === 'confirm-roster' && (
          <>
            <div className="relative p-6 border-b border-slate-200 bg-gradient-to-r from-green-600 to-emerald-600">
              <button
                onClick={onCancel}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                ✕
              </button>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">
                  Confirm Teams for Game {gameNumber}
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Team Rosters Preview */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setStep('select-staying')}
                  className="relative p-4 bg-blue-50 rounded-xl border-2 border-blue-200 text-left hover:bg-blue-100 cursor-pointer transition-colors"
                >
                  <svg className="absolute top-3 right-3 w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <h3 className="font-bold text-blue-800 text-center mb-2">
                    Team A ({losingTeam === 'team_a' ? getNewRoster().length : players.teamA.length})
                  </h3>
                  <div className="space-y-1">
                    {losingTeam === 'team_a' ? (
                      getNewRoster().map((player) => {
                        const isNew = selectedStaying.size === 0 || selectedFromBench.has(player.name);
                        return (
                          <div key={player.name} className="text-sm text-slate-700 font-semibold">
                            {player.name} {isNew && <span className="text-green-600">*</span>}
                          </div>
                        );
                      })
                    ) : (
                      players.teamA.map((player) => (
                        <div key={player.name} className="text-sm text-slate-700 font-semibold">
                          {player.name}
                        </div>
                      ))
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setStep('select-staying')}
                  className="relative p-4 bg-red-50 rounded-xl border-2 border-red-200 text-left hover:bg-red-100 cursor-pointer transition-colors"
                >
                  <svg className="absolute top-3 right-3 w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <h3 className="font-bold text-red-800 text-center mb-2">
                    Team B ({losingTeam === 'team_b' ? getNewRoster().length : players.teamB.length})
                  </h3>
                  <div className="space-y-1">
                    {losingTeam === 'team_b' ? (
                      getNewRoster().map((player) => {
                        const isNew = selectedStaying.size === 0 || selectedFromBench.has(player.name);
                        return (
                          <div key={player.name} className="text-sm text-slate-700 font-semibold">
                            {player.name} {isNew && <span className="text-green-600">*</span>}
                          </div>
                        );
                      })
                    ) : (
                      players.teamB.map((player) => (
                        <div key={player.name} className="text-sm text-slate-700 font-semibold">
                          {player.name}
                        </div>
                      ))
                    )}
                  </div>
                </button>
              </div>

              {/* Bench */}
              <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-center">
                <h3 className="font-bold text-slate-700 mb-2">
                  Bench ({(() => {
                    if (selectedStaying.size === 0) {
                      // Bench = unselected bench players + all losing team players
                      return benchPlayers.length - selectedFromBench.size + losingTeamPlayers.length;
                    }
                    return benchPlayers.length - selectedFromBench.size + losingTeamPlayers.length - selectedStaying.size;
                  })()})
                </h3>
                <p className="text-sm text-slate-700 font-semibold">
                  {(() => {
                    if (selectedStaying.size === 0) {
                      // Bench = unselected bench players + all losing team players
                      return [
                        ...benchPlayers.filter(p => !selectedFromBench.has(p.name)),
                        ...losingTeamPlayers
                      ].map(p => p.name).join(', ');
                    }
                    return [
                      ...benchPlayers.filter(p => !selectedFromBench.has(p.name)),
                      ...losingTeamPlayers.filter(p => !selectedStaying.has(p.name))
                    ].map(p => p.name).join(', ');
                  })()}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Always go back to select-staying since that's the first step
                    setStep('select-staying');
                  }}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmRoster}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all"
                >
                  Confirm & Start Game {gameNumber}
                </button>
              </div>
            </div>
          </>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostGameFlow;
