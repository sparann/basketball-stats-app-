import { useState, useEffect } from 'react';
import { useLiveSession } from './LiveSessionContext';

const ManageTeamsFlow = ({ onComplete, onCancel }) => {
  const { players, gameNumber, actions } = useLiveSession();
  const [step, setStep] = useState('select-teams'); // 'select-teams' -> 'select-from-bench' -> 'confirm-roster'
  const [selectedTeamA, setSelectedTeamA] = useState(new Set(players.teamA.map(p => p.name)));
  const [selectedTeamB, setSelectedTeamB] = useState(new Set(players.teamB.map(p => p.name)));
  const [selectedFromBench, setSelectedFromBench] = useState(new Set());

  const benchPlayers = players.sittingOut;
  const targetTeamSize = players.teamA.length; // Both teams should be same size

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // If no bench, complete immediately (no roster changes needed)
  useEffect(() => {
    if (benchPlayers.length === 0) {
      onComplete();
    }
  }, [benchPlayers.length, onComplete]);

  const toggleTeamA = (playerName) => {
    const newSelected = new Set(selectedTeamA);
    if (newSelected.has(playerName)) {
      newSelected.delete(playerName);
    } else {
      newSelected.add(playerName);
    }
    setSelectedTeamA(newSelected);
  };

  const toggleTeamB = (playerName) => {
    const newSelected = new Set(selectedTeamB);
    if (newSelected.has(playerName)) {
      newSelected.delete(playerName);
    } else {
      newSelected.add(playerName);
    }
    setSelectedTeamB(newSelected);
  };

  const toggleFromBench = (playerName) => {
    const newSelected = new Set(selectedFromBench);
    if (newSelected.has(playerName)) {
      newSelected.delete(playerName);
    } else {
      newSelected.add(playerName);
    }
    setSelectedFromBench(newSelected);
  };

  const handleSelectTeamsDone = () => {
    const totalSelected = selectedTeamA.size + selectedTeamB.size;
    const totalNeeded = targetTeamSize * 2;
    const needFromBench = totalNeeded - totalSelected;

    if (needFromBench < 0) {
      alert(`Too many players selected. You need exactly ${totalNeeded} players total (${targetTeamSize} per team).`);
      return;
    }

    if (needFromBench === 0) {
      // Teams are full, go straight to confirm
      setStep('confirm-roster');
      return;
    }

    // Need to select from bench
    setStep('select-from-bench');
  };

  const handleSelectFromBenchDone = () => {
    const totalSelected = selectedTeamA.size + selectedTeamB.size;
    const totalNeeded = targetTeamSize * 2;
    const needFromBench = totalNeeded - totalSelected;

    if (selectedFromBench.size !== needFromBench) {
      alert(`Please select ${needFromBench} ${needFromBench === 1 ? 'player' : 'players'} from the bench`);
      return;
    }

    setStep('confirm-roster');
  };

  const handleConfirmRoster = () => {
    // Calculate new rosters
    const teamAPlayers = players.teamA.filter(p => selectedTeamA.has(p.name));
    const teamBPlayers = players.teamB.filter(p => selectedTeamB.has(p.name));

    // Players going to bench
    const teamASitting = players.teamA.filter(p => !selectedTeamA.has(p.name));
    const teamBSitting = players.teamB.filter(p => !selectedTeamB.has(p.name));

    // Bench players joining
    const benchJoining = Array.from(selectedFromBench);

    // Calculate how many players each team needs from bench
    const teamANeed = targetTeamSize - selectedTeamA.size;
    const teamBNeed = targetTeamSize - selectedTeamB.size;

    // Distribute bench players to teams that need them
    const benchForTeamA = benchPlayers.filter(p => selectedFromBench.has(p.name)).slice(0, teamANeed);
    const benchForTeamB = benchPlayers.filter(p => selectedFromBench.has(p.name)).slice(teamANeed);

    const newTeamA = [...teamAPlayers, ...benchForTeamA];
    const newTeamB = [...teamBPlayers, ...benchForTeamB];
    const newBench = [
      ...benchPlayers.filter(p => !selectedFromBench.has(p.name)),
      ...teamASitting,
      ...teamBSitting
    ];

    // Update rosters
    actions.updateRoster({
      teamA: newTeamA,
      teamB: newTeamB,
      sittingOut: newBench
    });

    onComplete();
  };

  const getAvailableBench = () => {
    // Show all bench + players who were deselected from teams
    const deselectedFromTeamA = players.teamA.filter(p => !selectedTeamA.has(p.name));
    const deselectedFromTeamB = players.teamB.filter(p => !selectedTeamB.has(p.name));
    return [...benchPlayers, ...deselectedFromTeamA, ...deselectedFromTeamB];
  };

  return (
    <div className="fixed inset-0 bg-slate-100 overflow-y-auto z-50">
      <div className="max-w-4xl mx-auto min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Select Teams */}
            {step === 'select-teams' && (
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
                      Manage Teams for Game {gameNumber}
                    </h2>
                    <p className="text-white text-sm mt-1 opacity-90">
                      Select who plays on each team (deselect anyone sitting out)
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Team A */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide">Team A</h3>
                        <span className="text-sm font-bold text-slate-600">
                          {selectedTeamA.size}/{targetTeamSize}
                        </span>
                      </div>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {players.teamA.map((player) => (
                          <button
                            key={player.name}
                            type="button"
                            onClick={() => toggleTeamA(player.name)}
                            className={`w-full px-4 py-3 rounded-xl font-semibold transition-all ${
                              selectedTeamA.has(player.name)
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{player.name}</span>
                              {selectedTeamA.has(player.name) && (
                                <span className="text-xl">✓</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Team B */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-red-700 uppercase tracking-wide">Team B</h3>
                        <span className="text-sm font-bold text-slate-600">
                          {selectedTeamB.size}/{targetTeamSize}
                        </span>
                      </div>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {players.teamB.map((player) => (
                          <button
                            key={player.name}
                            type="button"
                            onClick={() => toggleTeamB(player.name)}
                            className={`w-full px-4 py-3 rounded-xl font-semibold transition-all ${
                              selectedTeamB.has(player.name)
                                ? 'bg-red-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{player.name}</span>
                              {selectedTeamB.has(player.name) && (
                                <span className="text-xl">✓</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={onCancel}
                      className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSelectTeamsDone}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all"
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
                      Select Players from Bench
                    </h2>
                    <p className="text-white text-sm mt-1 opacity-90">
                      Select {targetTeamSize * 2 - selectedTeamA.size - selectedTeamB.size} more players to fill teams
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="mb-4 p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-center">
                    <p className="text-slate-700 font-semibold">
                      {selectedFromBench.size} of {targetTeamSize * 2 - selectedTeamA.size - selectedTeamB.size} selected
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {getAvailableBench().map((player) => (
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
                      onClick={() => setStep('select-teams')}
                      className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSelectFromBenchDone}
                      disabled={selectedFromBench.size !== (targetTeamSize * 2 - selectedTeamA.size - selectedTeamB.size)}
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
                  {/* Team Preview */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Team A Preview */}
                    <button
                      onClick={() => setStep('select-teams')}
                      className="relative p-4 bg-blue-50 rounded-xl border-2 border-blue-200 text-left hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                      <svg className="absolute top-3 right-3 w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <h3 className="font-bold text-blue-800 text-center mb-2">
                        Team A ({selectedTeamA.size})
                      </h3>
                      <div className="space-y-1">
                        {Array.from(selectedTeamA).map((name) => (
                          <div key={name} className="text-sm text-slate-700 font-semibold">
                            {name}
                          </div>
                        ))}
                      </div>
                    </button>

                    {/* Team B Preview */}
                    <button
                      onClick={() => setStep('select-teams')}
                      className="relative p-4 bg-red-50 rounded-xl border-2 border-red-200 text-left hover:bg-red-100 cursor-pointer transition-colors"
                    >
                      <svg className="absolute top-3 right-3 w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <h3 className="font-bold text-red-800 text-center mb-2">
                        Team B ({selectedTeamB.size})
                      </h3>
                      <div className="space-y-1">
                        {Array.from(selectedTeamB).map((name) => (
                          <div key={name} className="text-sm text-slate-700 font-semibold">
                            {name}
                          </div>
                        ))}
                      </div>
                    </button>
                  </div>

                  {/* Bench Preview */}
                  <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-center">
                    <h3 className="font-bold text-slate-700 mb-2">
                      Bench ({getAvailableBench().length - selectedFromBench.size})
                    </h3>
                    <p className="text-sm text-slate-700 font-semibold">
                      {getAvailableBench()
                        .filter(p => !selectedFromBench.has(p.name))
                        .map(p => p.name)
                        .join(', ')}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('select-teams')}
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

export default ManageTeamsFlow;
