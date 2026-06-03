import { useState, useEffect, useMemo } from 'react';
import { useLiveSession } from './LiveSessionContext';

const SimpleRotationFlow = ({ winningTeam, losingTeam, onComplete, onCancel }) => {
  const { players, gameNumber, actions, allSessionPlayers } = useLiveSession();
  const [selectedPlayers, setSelectedPlayers] = useState(new Set());

  const winningTeamKey = winningTeam === 'team_a' ? 'teamA' : 'teamB';
  const losingTeamKey = losingTeam === 'team_a' ? 'teamA' : 'teamB';
  const winningTeamPlayers = players[winningTeamKey] || [];
  const losingTeamPlayers = players[losingTeamKey] || [];

  const [newTeamA, setNewTeamA] = useState([]);
  const [newTeamB, setNewTeamB] = useState([]);
  const [benchPlayers, setBenchPlayers] = useState([]);

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

  // Initialize assignment state - start with current rosters
  useEffect(() => {
    setNewTeamA(players.teamA || []);
    setNewTeamB(players.teamB || []);
    setBenchPlayers(players.sittingOut || []);
  }, [players]);

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
      alert(`Teams must be equal size!\nTeam A: ${newTeamA.length}\nTeam B: ${newTeamB.length}`);
      return;
    }

    if (newTeamA.length === 0) {
      alert('Teams cannot be empty!');
      return;
    }

    actions.updateRoster({
      teamA: newTeamA,
      teamB: newTeamB,
      sittingOut: benchPlayers
    });

    onComplete();
  };

  const teamColors = {
    team_a: {
      gradient: 'from-blue-600 to-indigo-600',
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-blue-600',
      border: 'border-blue-600',
      light: 'bg-blue-50',
      lightBorder: 'border-blue-200'
    },
    team_b: {
      gradient: 'from-red-600 to-rose-600',
      bg: 'bg-red-600',
      hover: 'hover:bg-red-700',
      text: 'text-red-600',
      border: 'border-red-600',
      light: 'bg-red-50',
      lightBorder: 'border-red-200'
    }
  };

  const winningColors = teamColors[winningTeam];
  const losingColors = teamColors[losingTeam];

  if (!winningTeamPlayers || !losingTeamPlayers) {
    return (
      <div className="fixed inset-0 bg-slate-100 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm">
          <p className="text-red-600 font-bold text-lg mb-4">Error: Team data not available</p>
          <button
            onClick={onCancel}
            className="w-full px-4 py-3 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-100 overflow-y-auto z-50">
      <div className="max-w-2xl mx-auto min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Click-to-Select Assignment */}
                <div className="relative p-4 border-b border-slate-200 bg-gradient-to-r from-slate-700 to-slate-800">
                  <button
                    onClick={onCancel}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors"
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
                        ? 'bg-blue-50 hover:bg-blue-100 border-blue-400 shadow-lg'
                        : 'bg-blue-50 border-blue-200 opacity-60'
                    }`}
                  >
                    <button
                      onClick={handleMoveToTeamA}
                      disabled={selectedPlayers.size === 0}
                      className={`w-full p-3 font-bold text-base transition-colors ${
                        selectedPlayers.size > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' : 'bg-blue-300 text-blue-100 cursor-not-allowed'
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
                        <p className="text-blue-400 text-sm italic w-full text-center py-2">Empty</p>
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
                                ? 'bg-green-500 text-white ring-2 ring-green-400 shadow-lg'
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
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-400 shadow-lg'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <button
                      onClick={handleMoveToBench}
                      disabled={selectedPlayers.size === 0}
                      className={`w-full p-3 font-bold text-base transition-colors ${
                        selectedPlayers.size > 0 ? 'bg-slate-600 hover:bg-slate-700 text-white cursor-pointer' : 'bg-slate-300 text-slate-100 cursor-not-allowed'
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
                        <p className="text-slate-400 text-sm italic w-full text-center py-2">Empty</p>
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
                                ? 'bg-green-500 text-white ring-2 ring-green-400 shadow-lg'
                                : 'bg-slate-600 text-white hover:bg-slate-700'
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
                        ? 'bg-red-50 hover:bg-red-100 border-red-400 shadow-lg'
                        : 'bg-red-50 border-red-200 opacity-60'
                    }`}
                  >
                    <button
                      onClick={handleMoveToTeamB}
                      disabled={selectedPlayers.size === 0}
                      className={`w-full p-3 font-bold text-base transition-colors ${
                        selectedPlayers.size > 0 ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer' : 'bg-red-300 text-red-100 cursor-not-allowed'
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
                        <p className="text-red-400 text-sm italic w-full text-center py-2">Empty</p>
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
                                ? 'bg-green-500 text-white ring-2 ring-green-400 shadow-lg'
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
                    <div className="px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg">
                      <p className="text-amber-800 font-semibold text-center text-xs">
                        ⚠️ Teams must be equal size
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t-2 border-slate-200">
                    <button
                      onClick={onCancel}
                      className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={newTeamA.length !== newTeamB.length || newTeamA.length === 0}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
