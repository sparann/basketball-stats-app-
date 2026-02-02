import { useState, useMemo } from 'react';
import PlayerCard from './PlayerCard';
import PlayerModal from './PlayerModal';
import { sortPlayers, isPlayerActive, aggregatePlayerStats } from '../utils/calculations';

const PlayerSummary = ({ players, onUpdatePlayer, sessions }) => {
  const [sortBy, setSortBy] = useState('winPercentage');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [timeFilter, setTimeFilter] = useState('allTime');
  const [showTimeFilter, setShowTimeFilter] = useState(false);
  const [showSortBy, setShowSortBy] = useState(false);

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

  const sortedPlayers = sortPlayers(filteredPlayerStats, sortBy);

  // Calculate ranks with tie handling (dense ranking)
  const playersWithRanks = useMemo(() => {
    let currentRank = 1;
    return sortedPlayers.map((player, index) => {
      if (index > 0) {
        const prevPlayer = sortedPlayers[index - 1];
        const isTied = sortBy === 'winPercentage'
          ? player.overallWinPercentage === prevPlayer.overallWinPercentage
          : player.totalGamesPlayed === prevPlayer.totalGamesPlayed;

        if (!isTied) {
          currentRank++;
        }
      }
      return { ...player, rank: currentRank };
    });
  }, [sortedPlayers, sortBy]);

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

  const getSortByLabel = () => {
    if (sortBy === 'winPercentage') return 'Win %';
    if (sortBy === 'totalGames') return 'Total Games';
    return 'Win %';
  };

  return (
    <div className="mb-8">
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 mb-8">
        <div className="flex items-center justify-between gap-8 flex-wrap">
          {/* Heading */}
          <h2 className="text-2xl font-bold text-slate-900">Player Standings</h2>

          {/* Filter and Sort Dropdowns */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter By */}
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

            {/* Sort By */}
            <div className="flex items-center gap-2 relative">
              <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">Sort by:</span>
              <button
                onClick={() => setShowSortBy(!showSortBy)}
                className="px-4 py-2 bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:shadow-md transition-all flex items-center gap-2"
              >
                {getSortByLabel()}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showSortBy && (
                <div className="absolute top-full right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-10 min-w-[150px] overflow-hidden">
                  <button
                    onClick={() => { setSortBy('winPercentage'); setShowSortBy(false); }}
                    className={`w-full px-4 py-2 text-left font-semibold text-sm hover:bg-slate-50 transition-colors ${sortBy === 'winPercentage' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'text-slate-700'}`}
                  >
                    Win %
                  </button>
                  <button
                    onClick={() => { setSortBy('totalGames'); setShowSortBy(false); }}
                    className={`w-full px-4 py-2 text-left font-semibold text-sm hover:bg-slate-50 transition-colors ${sortBy === 'totalGames' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'text-slate-700'}`}
                  >
                    Total Games
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playersWithRanks.map((player) => (
          <PlayerCard
            key={player.name}
            player={player}
            rank={player.rank}
            onClick={() => setSelectedPlayer(player)}
          />
        ))}
      </div>

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
