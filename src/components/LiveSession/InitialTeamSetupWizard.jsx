import { useState, useEffect, useMemo } from 'react';
import { useLiveSession } from './LiveSessionContext';
import { useUI } from '../../context/ui-context';

const InitialTeamSetupWizard = ({ onComplete }) => {
  const { players, actions, gameNumber, allSessionPlayers } = useLiveSession();
  const { toast } = useUI();
  const [step, setStep] = useState(1);
  const [teamASelection, setTeamASelection] = useState(new Set());
  const [teamBSelection, setTeamBSelection] = useState(new Set());

  const allPlayers = [...players.teamA, ...players.teamB, ...players.sittingOut];
  const availableForTeamB = allPlayers.filter(p => !teamASelection.has(p.name));

  // Helper: Get display name (first name + last initial if duplicate)
  const getDisplayName = useMemo(() => {
    return (fullName, allPlayers) => {
      const parts = fullName.trim().split(' ');
      const firstName = parts[0];
      const lastName = parts.length > 1 ? parts[parts.length - 1] : '';

      // Check for duplicates with same first name
      const duplicates = allPlayers.filter(p => {
        const pFirstName = p.name.trim().split(' ')[0];
        return pFirstName.toLowerCase() === firstName.toLowerCase();
      });

      if (duplicates.length > 1 && lastName) {
        return `${firstName} ${lastName.charAt(0)}.`;
      }

      return firstName;
    };
  }, []);


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
      toast('Pick at least one player for Team A', { type: 'error' });
      return;
    }
    setStep(2);
  };

  const handleTeamBNext = () => {
    if (teamBSelection.size === 0) {
      toast('Pick at least one player for Team B', { type: 'error' });
      return;
    }

    if (teamASelection.size !== teamBSelection.size) {
      toast(`Teams must match: ${teamASelection.size} v ${teamBSelection.size}`, { type: 'error' });
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
    <div className="fixed inset-0 bg-court overflow-y-auto z-50">
      <div className="max-w-2xl mx-auto min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-6 border-b border-line ${
          step === 1
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
            : 'bg-gradient-to-r from-red-600 to-rose-600'
        }`}>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">
              {step === 1 ? `Game ${gameNumber}: Select Team A` : `Game ${gameNumber}: Select Team B`}
            </h2>
            <p className="text-white text-sm mt-1 opacity-75">
              {step === 1
                ? `${teamASelection.size} ${teamASelection.size === 1 ? 'player' : 'players'} selected`
                : `${teamBSelection.size} of ${teamASelection.size} selected`
              }
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Team A Selection */}
          {step === 1 && (
            <>
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
                          ? 'bg-surface-2 text-ink-3 border-2 border-line cursor-not-allowed opacity-50'
                          : 'bg-surface-2 text-ink hover:bg-line-strong border-2 border-line'
                      }`}
                    >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-surface-2 text-ink-2 flex items-center justify-center font-bold text-xs">
                          {player.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <p className="font-bold">{getDisplayName(player.name, allSessionPlayers)}</p>
                      </div>
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
                          ? 'bg-surface-2 text-ink-3 border-2 border-line cursor-not-allowed opacity-50'
                          : 'bg-surface-2 text-ink hover:bg-line-strong border-2 border-line'
                      }`}
                    >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-surface-2 text-ink-2 flex items-center justify-center font-bold text-xs">
                          {player.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <p className="font-bold">{getDisplayName(player.name, allSessionPlayers)}</p>
                      </div>
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
                  className="px-6 py-3 bg-surface-2 text-ink rounded-xl font-semibold hover:bg-line-strong transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleTeamBNext}
                  disabled={teamBSelection.size !== teamASelection.size}
                  className="flex-1 px-6 py-4 bg-accent text-accent-ink rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Start Game
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
