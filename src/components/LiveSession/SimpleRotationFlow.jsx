import { useState, useEffect, useMemo } from 'react';
import { useLiveSession } from './LiveSessionContext';
import { useUI } from '../../context/ui-context';

const SimpleRotationFlow = ({ winningTeam, losingTeam, onComplete, onCancel }) => {
  const { players, gameNumber, actions, allSessionPlayers } = useLiveSession();
  const { toast } = useUI();
  const [selectedPlayers, setSelectedPlayers] = useState(new Set());

  const winningTeamKey = winningTeam === 'team_a' ? 'teamA' : 'teamB';
  const losingTeamKey = losingTeam === 'team_a' ? 'teamA' : 'teamB';
  const winningTeamPlayers = players[winningTeamKey] || [];
  const losingTeamPlayers = players[losingTeamKey] || [];

  // Start from the rosters on the floor. This flow mounts fresh after every game.
  const [newTeamA, setNewTeamA] = useState(() => players.teamA || []);
  const [newTeamB, setNewTeamB] = useState(() => players.teamB || []);
  const [benchPlayers, setBenchPlayers] = useState(() => players.sittingOut || []);

  // Helper: Parse name and detect duplicates
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

  // Multi-select toggle
  const handleTogglePlayer = (player) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(player.name)) {
      newSelected.delete(player.name);
    } else {
      newSelected.add(player.name);
    }
    setSelectedPlayers(newSelected);

    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const handleMoveToTeamA = () => {
    if (selectedPlayers.size === 0) return;

    const playersToMove = [...newTeamA, ...newTeamB, ...benchPlayers].filter(p =>
      selectedPlayers.has(p.name)
    );

    // Remove from all locations
    setBenchPlayers(prev => prev.filter(p => !selectedPlayers.has(p.name)));
    setNewTeamB(prev => prev.filter(p => !selectedPlayers.has(p.name)));
    setNewTeamA(prev => [...prev.filter(p => !selectedPlayers.has(p.name)), ...playersToMove]);

    setSelectedPlayers(new Set());
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleMoveToTeamB = () => {
    if (selectedPlayers.size === 0) return;

    const playersToMove = [...newTeamA, ...newTeamB, ...benchPlayers].filter(p =>
      selectedPlayers.has(p.name)
    );

    // Remove from all locations
    setBenchPlayers(prev => prev.filter(p => !selectedPlayers.has(p.name)));
    setNewTeamA(prev => prev.filter(p => !selectedPlayers.has(p.name)));
    setNewTeamB(prev => [...prev.filter(p => !selectedPlayers.has(p.name)), ...playersToMove]);

    setSelectedPlayers(new Set());
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleMoveToBench = () => {
    if (selectedPlayers.size === 0) return;

    const playersToMove = [...newTeamA, ...newTeamB, ...benchPlayers].filter(p =>
      selectedPlayers.has(p.name)
    );

    // Remove from all locations
    setNewTeamA(prev => prev.filter(p => !selectedPlayers.has(p.name)));
    setNewTeamB(prev => prev.filter(p => !selectedPlayers.has(p.name)));
    setBenchPlayers(prev => [...prev.filter(p => !selectedPlayers.has(p.name)), ...playersToMove]);

    setSelectedPlayers(new Set());
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleConfirm = () => {
    if (newTeamA.length !== newTeamB.length) {
      toast(`Teams must match: ${newTeamA.length} v ${newTeamB.length}`, { type: 'error' });
      return;
    }

    if (newTeamA.length === 0) {
      toast('Both teams need players', { type: 'error' });
      return;
    }

    actions.updateRoster({
      teamA: newTeamA,
      teamB: newTeamB,
      sittingOut: benchPlayers
    });

    onComplete();
  };

  if (!winningTeamPlayers || !losingTeamPlayers) {
    return (
      <div className="fixed inset-0 bg-court flex items-center justify-center z-50 p-4">
        <div className="bg-surface p-8 rounded-2xl shadow-xl max-w-sm">
          <p className="text-red-400 font-bold text-lg mb-4">Error: Team data not available</p>
          <button
            onClick={onCancel}
            className="w-full px-4 py-3 bg-surface-2 text-ink-2 rounded-xl font-semibold hover:bg-line-strong transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-court overflow-y-auto z-50">
      <div className="max-w-2xl mx-auto min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Click-to-Select Assignment */}
                <div className="relative p-4 border-b border-line bg-surface-2">
                  <button
                    onClick={onCancel}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-white hover:bg-ink/10 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-white">
                      Game {gameNumber} Teams
                    </h2>
                  </div>
                </div>

                <div className="p-4 space-y-3">

                  {/* Team A Bucket */}
                  <div
                    className={`w-full rounded-xl border-2 transition-all overflow-hidden ${
                      selectedPlayers.size > 0
                        ? 'bg-blue-950/50 hover:bg-blue-900/50 border-blue-500 shadow-lg'
                        : 'bg-blue-950/30 border-blue-900 opacity-70'
                    }`}
                  >
                    <button
                      onClick={handleMoveToTeamA}
                      disabled={selectedPlayers.size === 0}
                      className={`w-full p-3 font-bold text-base transition-colors ${
                        selectedPlayers.size > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' : 'bg-blue-900/40 text-blue-200/60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className={winningTeam === 'team_a' ? '' : 'opacity-60 font-black'}>
                            {winningTeam === 'team_a' ? '🏆' : '✕'}
                          </span>
                          <span>Team A</span>
                        </span>
                        <span className="text-sm opacity-75">({newTeamA.length})</span>
                      </div>
                    </button>
                    <div
                      onClick={() => selectedPlayers.size > 0 && handleMoveToTeamA()}
                      className={`flex flex-wrap gap-2 min-h-[50px] p-2 ${selectedPlayers.size > 0 ? 'cursor-pointer' : ''}`}
                    >
                      {newTeamA.length === 0 ? (
                        <p className="text-blue-400/60 text-sm italic w-full text-center py-2">Empty</p>
                      ) : (
                        newTeamA.map((player) => (
                          <button
                            key={player.name}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePlayer(player);
                            }}
                            className={`px-3 py-2 rounded-full font-bold text-sm transition-all ${
                              selectedPlayers.has(player.name)
                                ? 'bg-accent-soft0 text-white ring-2 ring-green-400 shadow-lg'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {getDisplayName(player.name, allSessionPlayers)}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Bench Bucket */}
                  <div
                    className={`w-full rounded-xl border-2 transition-all overflow-hidden ${
                      selectedPlayers.size > 0
                        ? 'bg-surface-2 hover:bg-surface-2 border-line-strong shadow-lg'
                        : 'bg-surface-2 border-line opacity-60'
                    }`}
                  >
                    <button
                      onClick={handleMoveToBench}
                      disabled={selectedPlayers.size === 0}
                      className={`w-full p-3 font-bold text-base transition-colors ${
                        selectedPlayers.size > 0 ? 'bg-line-strong hover:bg-line-strong text-white cursor-pointer' : 'bg-line-strong text-ink cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span>→</span>
                          <span>Bench</span>
                        </span>
                        <span className="text-sm opacity-75">({benchPlayers.length})</span>
                      </div>
                    </button>
                    <div
                      onClick={() => selectedPlayers.size > 0 && handleMoveToBench()}
                      className={`flex flex-wrap gap-2 min-h-[50px] p-2 ${selectedPlayers.size > 0 ? 'cursor-pointer' : ''}`}
                    >
                      {benchPlayers.length === 0 ? (
                        <p className="text-ink-3 text-sm italic w-full text-center py-2">Empty</p>
                      ) : (
                        benchPlayers.map((player) => (
                          <button
                            key={player.name}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePlayer(player);
                            }}
                            className={`px-3 py-2 rounded-full font-bold text-sm transition-all ${
                              selectedPlayers.has(player.name)
                                ? 'bg-accent-soft0 text-white ring-2 ring-green-400 shadow-lg'
                                : 'bg-surface-2 text-ink-2 hover:bg-line-strong'
                            }`}
                          >
                            {getDisplayName(player.name, allSessionPlayers)}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Team B Bucket */}
                  <div
                    className={`w-full rounded-xl border-2 transition-all overflow-hidden ${
                      selectedPlayers.size > 0
                        ? 'bg-red-950/50 hover:bg-red-900/50 border-red-500 shadow-lg'
                        : 'bg-red-950/30 border-red-900 opacity-70'
                    }`}
                  >
                    <button
                      onClick={handleMoveToTeamB}
                      disabled={selectedPlayers.size === 0}
                      className={`w-full p-3 font-bold text-base transition-colors ${
                        selectedPlayers.size > 0 ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer' : 'bg-red-900/40 text-red-200/60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className={winningTeam === 'team_b' ? '' : 'opacity-60 font-black'}>
                            {winningTeam === 'team_b' ? '🏆' : '✕'}
                          </span>
                          <span>Team B</span>
                        </span>
                        <span className="text-sm opacity-75">({newTeamB.length})</span>
                      </div>
                    </button>
                    <div
                      onClick={() => selectedPlayers.size > 0 && handleMoveToTeamB()}
                      className={`flex flex-wrap gap-2 min-h-[50px] p-2 ${selectedPlayers.size > 0 ? 'cursor-pointer' : ''}`}
                    >
                      {newTeamB.length === 0 ? (
                        <p className="text-red-400/60 text-sm italic w-full text-center py-2">Empty</p>
                      ) : (
                        newTeamB.map((player) => (
                          <button
                            key={player.name}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePlayer(player);
                            }}
                            className={`px-3 py-2 rounded-full font-bold text-sm transition-all ${
                              selectedPlayers.has(player.name)
                                ? 'bg-accent-soft0 text-white ring-2 ring-green-400 shadow-lg'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            {getDisplayName(player.name, allSessionPlayers)}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Validation Message */}
                  {newTeamA.length !== newTeamB.length && (
                    <div className="px-3 py-2 bg-accent-soft border border-line-strong rounded-lg">
                      <p className="text-accent font-semibold text-center text-xs">
                        ⚠️ Teams must be equal size
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t-2 border-line">
                    <button
                      onClick={onCancel}
                      className="px-6 py-3 bg-surface-2 text-ink rounded-xl font-semibold hover:bg-line-strong transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={newTeamA.length !== newTeamB.length || newTeamA.length === 0}
                      className="flex-1 px-6 py-4 bg-accent text-accent-ink rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Start Game {gameNumber}
                    </button>
                  </div>
                </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleRotationFlow;
