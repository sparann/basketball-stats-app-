import { useState, useEffect } from 'react';
import { useLiveSession } from './LiveSessionContext';

const InitialTeamSetupWizard = ({ onComplete }) => {
  const { players, actions, gameNumber } = useLiveSession();
  const [step, setStep] = useState(1);
  const [teamASelection, setTeamASelection] = useState(new Set());
  const [teamBSelection, setTeamBSelection] = useState(new Set());

  const allPlayers = [...players.teamA, ...players.teamB, ...players.sittingOut];
  const availableForTeamB = allPlayers.filter(p => !teamASelection.has(p.name));

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const togglePlayerTeamA = (playerName) => {
    const newSelection = new Set(teamASelection);
    if (newSelection.has(playerName)) {
      newSelection.delete(playerName);
    } else {
      newSelection.add(playerName);
    }
    setTeamASelection(newSelection);
  };

  const togglePlayerTeamB = (playerName) => {
    const newSelection = new Set(teamBSelection);
    if (newSelection.has(playerName)) {
      newSelection.delete(playerName);
    } else {
      newSelection.add(playerName);
    }
    setTeamBSelection(newSelection);
  };

  const handleTeamANext = () => {
    if (teamASelection.size === 0) {
      alert('Please select at least 1 player for Team A');
      return;
    }
    setStep(2);
  };

  const handleTeamBNext = () => {
    if (teamBSelection.size === 0) {
      alert('Please select at least 1 player for Team B');
      return;
    }

    if (teamASelection.size !== teamBSelection.size) {
      alert(`Teams must be equal size. Team A has ${teamASelection.size} players, Team B has ${teamBSelection.size} players.`);
      return;
    }

    // Apply roster
    const teamAPlayers = allPlayers.filter(p => teamASelection.has(p.name));
    const teamBPlayers = allPlayers.filter(p => teamBSelection.has(p.name));
    const benchPlayers = allPlayers.filter(p =>
      !teamASelection.has(p.name) && !teamBSelection.has(p.name)
    );

    actions.updateRoster({
      teamA: teamAPlayers,
      teamB: teamBPlayers,
      sittingOut: benchPlayers
    });

    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-slate-100 overflow-y-auto z-50">
      <div className="max-w-2xl mx-auto min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-6 border-b border-slate-200 ${
          step === 1
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
            : 'bg-gradient-to-r from-red-600 to-rose-600'
        }`}>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">
              {step === 1 ? `Game ${gameNumber}: Select Team A` : `Game ${gameNumber}: Select Team B`}
            </h2>
            <p className="text-white text-sm mt-1 opacity-90">
              {step === 1
                ? 'Choose players for Team A'
                : `Choose ${teamASelection.size} players for Team B to match Team A`
              }
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              step === 1 ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
            }`}>
              A
            </div>
            <div className="w-12 h-1 bg-slate-200"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              step === 2 ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              B
            </div>
          </div>

          {/* Team A Selection */}
          {step === 1 && (
            <>
              <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-center">
                <p className="text-blue-800 font-semibold">
                  {teamASelection.size} {teamASelection.size === 1 ? 'player' : 'players'} selected
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {allPlayers.map((player) => {
                  const isSelected = teamASelection.has(player.name);
                  const isDisabled = !isSelected && teamASelection.size >= 5;
                  return (
                    <button
                      key={player.name}
                      type="button"
                      onClick={() => togglePlayerTeamA(player.name)}
                      disabled={isDisabled}
                      className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : isDisabled
                          ? 'bg-slate-50 text-slate-400 border-2 border-slate-200 cursor-not-allowed opacity-50'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200'
                      }`}
                    >
                    <div className="flex items-center justify-between w-full">
                      <p className="font-bold">{player.name}</p>
                      {teamASelection.has(player.name) && (
                        <span className="text-xl">✓</span>
                      )}
                    </div>
                  </button>
                );
                })}
              </div>

              <button
                onClick={handleTeamANext}
                disabled={teamASelection.size === 0}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next: Select Team B →
              </button>
            </>
          )}

          {/* Team B Selection */}
          {step === 2 && (
            <>
              <div className="mb-4 p-3 bg-slate-50 border-2 border-slate-200 rounded-xl">
                <div className="grid grid-cols-2 gap-2 text-center text-sm">
                  <div>
                    <p className="text-slate-500 font-semibold">Team A</p>
                    <p className="text-blue-600 font-bold text-lg">{teamASelection.size}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-semibold">Team B</p>
                    <p className={`font-bold text-lg ${
                      teamBSelection.size === teamASelection.size
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {teamBSelection.size}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {availableForTeamB.map((player) => {
                  const isSelected = teamBSelection.has(player.name);
                  const isDisabled = !isSelected && teamBSelection.size >= 5;
                  return (
                    <button
                      key={player.name}
                      type="button"
                      onClick={() => togglePlayerTeamB(player.name)}
                      disabled={isDisabled}
                      className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                        isSelected
                          ? 'bg-red-600 text-white shadow-md'
                          : isDisabled
                          ? 'bg-slate-50 text-slate-400 border-2 border-slate-200 cursor-not-allowed opacity-50'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200'
                      }`}
                    >
                    <div className="flex items-center justify-between w-full">
                      <p className="font-bold">{player.name}</p>
                      {teamBSelection.has(player.name) && (
                        <span className="text-xl">✓</span>
                      )}
                    </div>
                  </button>
                );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleTeamBNext}
                  disabled={teamBSelection.size !== teamASelection.size}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {teamBSelection.size === teamASelection.size
                    ? `Start Game! (${teamASelection.size}v${teamBSelection.size})`
                    : `Need ${teamASelection.size} players for Team B`
                  }
                </button>
              </div>
            </>
          )}
        </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitialTeamSetupWizard;
