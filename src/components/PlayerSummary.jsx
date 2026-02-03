import { useState, useMemo } from 'react';
import PlayerCard from './PlayerCard';
import PlayerModal from './PlayerModal';
import {
  aggregatePlayerStats,
  calculateLeagueAverage,
  calculateAdjustedWinPercentage,
  calculateMinimumGamesThreshold,
  categorizePlayersByStanding
} from '../utils/calculations';

const PlayerSummary = ({ players, onUpdatePlayer, sessions }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [timeFilter, setTimeFilter] = useState('allTime');
  const [showAdjusted, setShowAdjusted] = useState(true);
  const [showTimeFilter, setShowTimeFilter] = useState(false);

  // Filter sessions based on time period
  const filteredSessions = useMemo(() => {
    if (timeFilter === 'allTime') return sessions;

    const now = new Date();
    const filterDate = new Date();

    if (timeFilter === 'week') {
      filterDate.setDate(now.getDate() - 7);
    } else if (timeFilter === 'month') {
      filterDate.setMonth(now.getMonth() - 1);
    } else if (timeFilter === 'year') {
      filterDate.setFullYear(now.getFullYear() - 1);
    }

    return sessions.filter(session => new Date(session.date) >= filterDate);
  }, [sessions, timeFilter]);

  // Recalculate player stats from filtered sessions
  const filteredPlayerStats = useMemo(() => {
    if (timeFilter === 'allTime') return players;

    const aggregated = aggregatePlayerStats(filteredSessions);
    // Merge with original player data for injured status and pictures
    return aggregated.map(player => {
      const originalPlayer = players.find(p => p.name === player.name);
      return {
        ...player,
        injured: originalPlayer?.injured || false,
        pictureUrl: originalPlayer?.pictureUrl || '',
        height: originalPlayer?.height || '',
        weight: originalPlayer?.weight || ''
      };
    });
  }, [filteredSessions, timeFilter, players]);

  // Calculate league stats
  const leagueAverage = useMemo(() =>
    calculateLeagueAverage(filteredPlayerStats),
    [filteredPlayerStats]
  );

  const minimumGames = useMemo(() =>
    calculateMinimumGamesThreshold(filteredPlayerStats),
    [filteredPlayerStats]
  );

  // Add adjusted win percentage to all players
  const playersWithAdjusted = useMemo(() => {
    return filteredPlayerStats.map(player => ({
      ...player,
      adjustedWinPercentage: calculateAdjustedWinPercentage(
        player.totalGamesWon,
        player.totalGamesPlayed,
        leagueAverage
      ),
      rawWinPercentage: player.overallWinPercentage
    }));
  }, [filteredPlayerStats, leagueAverage]);

  // Categorize players
  const categorizedPlayers = useMemo(() =>
    categorizePlayersByStanding(playersWithAdjusted, minimumGames),
    [playersWithAdjusted, minimumGames]
  );

  // Sort each category by adjusted win percentage
  const sortedActive = useMemo(() =>
    [...categorizedPlayers.active].sort((a, b) => b.adjustedWinPercentage - a.adjustedWinPercentage),
    [categorizedPlayers.active]
  );

  const sortedNeedsMore = useMemo(() =>
    [...categorizedPlayers.needsMoreGames].sort((a, b) => b.adjustedWinPercentage - a.adjustedWinPercentage),
    [categorizedPlayers.needsMoreGames]
  );

  const sortedInactive = useMemo(() =>
    [...categorizedPlayers.inactive].sort((a, b) => b.adjustedWinPercentage - a.adjustedWinPercentage),
    [categorizedPlayers.inactive]
  );

  // Calculate ranks for active players (dense ranking)
  const activeWithRanks = useMemo(() => {
    let currentRank = 1;
    return sortedActive.map((player, index) => {
      if (index > 0) {
        const prevPlayer = sortedActive[index - 1];
        const isTied = player.adjustedWinPercentage === prevPlayer.adjustedWinPercentage;
        if (!isTied) {
          currentRank++;
        }
      }
      return { ...player, rank: currentRank };
    });
  }, [sortedActive]);

  const handleToggleInjured = () => {
    if (selectedPlayer && onUpdatePlayer) {
      onUpdatePlayer({
        ...selectedPlayer,
        injured: !selectedPlayer.injured
      });
      setSelectedPlayer({
        ...selectedPlayer,
        injured: !selectedPlayer.injured
      });
    }
  };

  const handleUpdatePicture = (pictureUrl) => {
    if (selectedPlayer && onUpdatePlayer) {
      onUpdatePlayer({
        ...selectedPlayer,
        pictureUrl
      });
      setSelectedPlayer({
        ...selectedPlayer,
        pictureUrl
      });
    }
  };

  const getTimeFilterLabel = () => {
    if (timeFilter === 'week') return 'Week';
    if (timeFilter === 'month') return 'Month';
    if (timeFilter === 'year') return 'Year';
    return 'All Time';
  };

  return (
    <div className="mb-8">
      {/* Header with Filters */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Heading */}
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">Player Standings</h2>
            <div className="group relative">
              <svg className="w-5 h-5 text-slate-400 hover:text-slate-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="invisible group-hover:visible absolute left-0 top-full mt-2 w-80 bg-slate-900 text-white text-sm p-4 rounded-xl shadow-xl z-50">
                <p className="font-bold mb-2">How Rankings Work:</p>
                <p className="mb-2">
                  <span className="font-semibold">Adjusted %:</span> Uses Bayesian averaging to prevent small sample sizes from dominating. Your win% is combined with {Math.round(leagueAverage * 100)}% league average × 15 phantom games.
                </p>
                <p className="mb-2">
                  <span className="font-semibold">Minimum Games:</span> Players need {minimumGames}+ games to qualify for standings (calculated as 40% of league average).
                </p>
                <p>Toggle "Raw %" to see unadjusted win percentages.</p>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Adjusted vs Raw Toggle */}
            <button
              onClick={() => setShowAdjusted(!showAdjusted)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all border-2 ${
                showAdjusted
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              {showAdjusted ? 'Adjusted %' : 'Raw %'}
            </button>

            {/* Time Filter */}
            <div className="flex items-center gap-2 relative">
              <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">Filter by:</span>
              <button
                onClick={() => setShowTimeFilter(!showTimeFilter)}
                className="px-4 py-2 bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:shadow-md transition-all flex items-center gap-2"
              >
                {getTimeFilterLabel()}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showTimeFilter && (
                <div className="absolute top-full right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-10 min-w-[150px] overflow-hidden">
                  <button
                    onClick={() => { setTimeFilter('week'); setShowTimeFilter(false); }}
                    className={`w-full px-4 py-2 text-left font-semibold text-sm hover:bg-slate-50 transition-colors ${timeFilter === 'week' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'text-slate-700'}`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => { setTimeFilter('month'); setShowTimeFilter(false); }}
                    className={`w-full px-4 py-2 text-left font-semibold text-sm hover:bg-slate-50 transition-colors ${timeFilter === 'month' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'text-slate-700'}`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => { setTimeFilter('year'); setShowTimeFilter(false); }}
                    className={`w-full px-4 py-2 text-left font-semibold text-sm hover:bg-slate-50 transition-colors ${timeFilter === 'year' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'text-slate-700'}`}
                  >
                    Year
                  </button>
                  <button
                    onClick={() => { setTimeFilter('allTime'); setShowTimeFilter(false); }}
                    className={`w-full px-4 py-2 text-left font-semibold text-sm hover:bg-slate-50 transition-colors ${timeFilter === 'allTime' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'text-slate-700'}`}
                  >
                    All Time
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Standings Section */}
      {activeWithRanks.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-bold text-slate-900">🏆 Active Standings</h3>
            <span className="text-sm font-semibold text-slate-500">({activeWithRanks.length} players • {minimumGames}+ games)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {activeWithRanks.map((player) => (
              <PlayerCard
                key={player.name}
                player={player}
                rank={player.rank}
                showAdjusted={showAdjusted}
                leagueAverage={leagueAverage}
                onClick={() => setSelectedPlayer(player)}
              />
            ))}
          </div>
        </>
      )}

      {/* Needs More Games Section */}
      {sortedNeedsMore.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-bold text-slate-900">📊 Needs More Games</h3>
            <span className="text-sm font-semibold text-slate-500">({sortedNeedsMore.length} players • {minimumGames - 1} games or fewer)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {sortedNeedsMore.map((player) => (
              <PlayerCard
                key={player.name}
                player={player}
                rank={null}
                showAdjusted={showAdjusted}
                leagueAverage={leagueAverage}
                onClick={() => setSelectedPlayer(player)}
              />
            ))}
          </div>
        </>
      )}

      {/* Inactive Players Section */}
      {sortedInactive.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-bold text-slate-900">💤 Inactive</h3>
            <span className="text-sm font-semibold text-slate-500">({sortedInactive.length} players • Last played 30+ days ago)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedInactive.map((player) => (
              <PlayerCard
                key={player.name}
                player={player}
                rank={null}
                showAdjusted={showAdjusted}
                leagueAverage={leagueAverage}
                onClick={() => setSelectedPlayer(player)}
              />
            ))}
          </div>
        </>
      )}

      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          onToggleInjured={handleToggleInjured}
          onUpdatePicture={handleUpdatePicture}
          sessions={filteredSessions}
        />
      )}
    </div>
  );
};

export default PlayerSummary;
