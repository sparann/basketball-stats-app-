import { useState, useEffect } from 'react';
import { useLiveSession } from './LiveSessionContext';

const QuickRosterModal = ({ winningTeam, losingTeam, onComplete }) => {
  const { players, gameNumber, actions } = useLiveSession();
  const [losingTeamPlayers, setLosingTeamPlayers] = useState([]);
  const [benchPlayers, setBenchPlayers] = useState([]);
  const [selectedToSit, setSelectedToSit] = useState(new Set());
  const [selectedFromBench, setSelectedFromBench] = useState(new Set());

  const losingTeamKey = losingTeam === 'team_a' ? 'teamA' : 'teamB';
  const winningTeamKey = winningTeam === 'team_a' ? 'teamA' : 'teamB';

  useEffect(() => {
    setLosingTeamPlayers(players[losingTeamKey]);
    setBenchPlayers(players.sittingOut);
  }, [players, losingTeamKey]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const togglePlayerToSit = (playerName) => {
    const newSelected = new Set(selectedToSit);
    if (newSelected.has(playerName)) {
      newSelected.delete(playerName);
    } else {
      newSelected.add(playerName);
    }
    setSelectedToSit(newSelected);
  };

  const togglePlayerFromBench = (playerName) => {
    const newSelected = new Set(selectedFromBench);
    if (newSelected.has(playerName)) {
      newSelected.delete(playerName);
    } else {
      newSelected.add(playerName);
    }
    setSelectedFromBench(newSelected);
  };

  const getNewTeamSize = () => {
    return losingTeamPlayers.length - selectedToSit.size + selectedFromBench.size;
  };

  const isValid = () => {
    const newSize = getNewTeamSize();
    const winningTeamSize = players[winningTeamKey].length;
    return newSize === winningTeamSize && newSize > 0;
  };

  const handleStartNextGame = () => {
    // Calculate new rosters
    const newLosingTeam = losingTeamPlayers
      .filter(p => !selectedToSit.has(p.name))
      .concat(benchPlayers.filter(p => selectedFromBench.has(p.name)));

    const newBench = benchPlayers
      .filter(p => !selectedFromBench.has(p.name))
      .concat(losingTeamPlayers.filter(p => selectedToSit.has(p.name)));

    // Update rosters
    if (losingTeam === 'team_a') {
      actions.updateRoster({
        teamA: newLosingTeam,
        teamB: players.teamB,
        sittingOut: newBench
      });
    } else {
      actions.updateRoster({
        teamA: players.teamA,
        teamB: newLosingTeam,
        sittingOut: newBench
      });
    }

    onComplete();
  };

  const handleSkip = () => {
    // Keep rosters as they are and just proceed
    onComplete();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && handleSkip()}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-600 to-slate-700">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">
              Setting up Game {gameNumber}
            </h2>
            <p className="text-slate-200 text-sm mt-1">
              {losingTeam === 'team_a' ? 'Team A' : 'Team B'} lost - update their roster
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <p className="text-blue-800 font-semibold text-sm">
              📋 Losing team shoots to decide who stays/sits
            </p>
            <p className="text-blue-600 text-xs mt-1">
              1. Select players from {losingTeam === 'team_a' ? 'Team A' : 'Team B'} who will sit out<br />
              2. Select bench players who will join {losingTeam === 'team_a' ? 'Team A' : 'Team B'}<br />
              3. Teams must be equal size ({players[winningTeamKey].length} players)
            </p>
          </div>

          {/* Losing Team Players */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-700">
                {losingTeam === 'team_a' ? 'Team A' : 'Team B'} - Select who sits
              </h3>
              <span className="text-sm font-semibold text-slate-500">
                {selectedToSit.size} sitting out
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {losingTeamPlayers.map((player) => (
                <button
                  key={player.name}
                  type="button"
                  onClick={() => togglePlayerToSit(player.name)}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                    selectedToSit.has(player.name)
                      ? 'bg-slate-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm">{player.name}</p>
                    <p className="text-xs opacity-75">
                      {player.gamesWon}-{player.gamesPlayed - player.gamesWon}
                    </p>
                  </div>
                  {selectedToSit.has(player.name) && (
                    <span className="absolute top-2 right-2 text-slate-200">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bench Players */}
          {benchPlayers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-700">
                  Bench - Tap to add to {losingTeam === 'team_a' ? 'Team A' : 'Team B'}
                </h3>
                <span className="text-sm font-semibold text-slate-500">
                  {selectedFromBench.size} joining
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {benchPlayers.map((player) => (
                  <button
                    key={player.name}
                    type="button"
                    onClick={() => togglePlayerFromBench(player.name)}
                    className={`relative px-4 py-3 rounded-xl font-semibold transition-all ${
                      selectedFromBench.has(player.name)
                        ? losingTeam === 'team_a'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-red-600 text-white shadow-md'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-300'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-sm">{player.name}</p>
                      <p className="text-xs opacity-75">
                        {player.gamesWon}-{player.gamesPlayed - player.gamesWon}
                      </p>
                    </div>
                    {selectedFromBench.has(player.name) && (
                      <span className="absolute top-2 right-2">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Team Size Validation */}
          <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-500 font-semibold">
                  {winningTeam === 'team_a' ? 'TEAM A' : 'TEAM B'} (Winners)
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {players[winningTeamKey].length}
                </p>
                <p className="text-xs text-slate-400">players</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">
                  {losingTeam === 'team_a' ? 'TEAM A' : 'TEAM B'} (New)
                </p>
                <p className={`text-2xl font-bold ${
                  isValid() ? 'text-green-600' : 'text-amber-600'
                }`}>
                  {getNewTeamSize()}
                </p>
                <p className="text-xs text-slate-400">
                  {isValid() ? 'Ready ✓' : `Need ${players[winningTeamKey].length}`}
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleStartNextGame}
              disabled={!isValid()}
              className="flex-1 px-5 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isValid() ? 'Start Next Game' : 'Teams Must Be Equal Size'}
            </button>
          </div>

          <button
            onClick={handleSkip}
            className="w-full px-4 py-2 text-slate-500 hover:text-slate-700 font-semibold text-sm transition-colors"
          >
            Skip roster update →
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickRosterModal;
