import { useState, useMemo } from 'react';
import PlayerCard from './PlayerCard';
import PlayerModal from './PlayerModal';
import { sortPlayers, isPlayerActive, aggregatePlayerStats } from '../utils/calculations';

const PlayerSummary = ({ players, onUpdatePlayer, sessions }) => {
  const [sortBy, setSortBy] = useState('winPercentage');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [timeFilter, setTimeFilter] = useState('allTime');

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
        <div className="flex items-center gap-8 flex-wrap">
          {/* Filter By */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">Filter by:</span>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-4 py-2 ${timeFilter === 'week' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-slate-50 border-2 border-slate-200 text-slate-700'} rounded-xl font-semibold text-sm hover:shadow-md transition-all`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-4 py-2 ${timeFilter === 'month' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-slate-50 border-2 border-slate-200 text-slate-700'} rounded-xl font-semibold text-sm hover:shadow-md transition-all`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeFilter('year')}
              className={`px-4 py-2 ${timeFilter === 'year' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-slate-50 border-2 border-slate-200 text-slate-700'} rounded-xl font-semibold text-sm hover:shadow-md transition-all`}
            >
              Year
            </button>
            <button
              onClick={() => setTimeFilter('allTime')}
              className={`px-4 py-2 ${timeFilter === 'allTime' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-slate-50 border-2 border-slate-200 text-slate-700'} rounded-xl font-semibold text-sm hover:shadow-md transition-all`}
            >
              All Time
            </button>
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
