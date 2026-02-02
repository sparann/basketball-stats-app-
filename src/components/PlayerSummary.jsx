import { useState, useMemo } from 'react';
import PlayerCard from './PlayerCard';
import PlayerModal from './PlayerModal';
import { sortPlayers, isPlayerActive, aggregatePlayerStats } from '../utils/calculations';

const PlayerSummary = ({ players, onUpdatePlayer, sessions }) => {
  const [sortBy, setSortBy] = useState('winPercentage');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [timeFilter, setTimeFilter] = useState('allTime');
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

  const sortedPlayers = sortPlayers(filteredPlayerStats, sortBy);

  // Calculate ranks with tie handling
  const playersWithRanks = useMemo(() => {
    let currentRank = 1;
    return sortedPlayers.map((player, index) => {
      if (index > 0) {
        const prevPlayer = sortedPlayers[index - 1];
        const isTied = sortBy === 'winPercentage'
          ? player.overallWinPercentage === prevPlayer.overallWinPercentage
          : player.totalGamesPlayed === prevPlayer.totalGamesPlayed;

        if (!isTied) {
          currentRank = index + 1;
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

  return (
    <div className="mb-8">
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Time Period Filter with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTimeFilter(!showTimeFilter)}
              className="px-4 py-2 bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {getTimeFilterLabel()}
            </button>

            {showTimeFilter && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowTimeFilter(false)}></div>
                <div className="absolute left-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20">
                  <button
                    onClick={() => {
                      setTimeFilter('week');
                      setShowTimeFilter(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm font-semibold ${timeFilter === 'week' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => {
                      setTimeFilter('month');
                      setShowTimeFilter(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm font-semibold ${timeFilter === 'month' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => {
                      setTimeFilter('year');
                      setShowTimeFilter(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm font-semibold ${timeFilter === 'year' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    Year
                  </button>
                  <button
                    onClick={() => {
                      setTimeFilter('allTime');
                      setShowTimeFilter(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm font-semibold ${timeFilter === 'allTime' ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    All Time
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">Sort by:</span>
            <button
              onClick={() => setSortBy('winPercentage')}
              className={`px-4 py-2 ${sortBy === 'winPercentage' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-slate-50 border-2 border-slate-200 text-slate-700'} rounded-xl font-semibold text-sm hover:shadow-md transition-all`}
            >
              Win %
            </button>
            <button
              onClick={() => setSortBy('totalGames')}
              className={`px-4 py-2 ${sortBy === 'totalGames' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-slate-50 border-2 border-slate-200 text-slate-700'} rounded-xl font-semibold text-sm hover:shadow-md transition-all`}
            >
              Total Games
            </button>
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
