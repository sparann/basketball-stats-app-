import { useState } from 'react';
import PlayerCard from './PlayerCard';
import { sortPlayers, isPlayerActive } from '../utils/calculations';

const PlayerSummary = ({ players }) => {
  const [sortBy, setSortBy] = useState('winPercentage');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  let filteredPlayers = showActiveOnly
    ? players.filter((player) => isPlayerActive(player.lastPlayed))
    : players;

  const sortedPlayers = sortPlayers(filteredPlayers, sortBy);

  return (
    <div className="player-summary">
      <div className="summary-controls">
        <div className="control-group">
          <label htmlFor="sort-by">Sort by:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="winPercentage">Win %</option>
            <option value="totalGames">Total Games</option>
            <option value="lastPlayed">Last Played</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="active-only">
            <input
              type="checkbox"
              id="active-only"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
            />
            Active players only (last 30 days)
          </label>
        </div>
      </div>

      <div className="player-cards-grid">
        {sortedPlayers.map((player) => (
          <PlayerCard key={player.name} player={player} />
        ))}
      </div>
    </div>
  );
};

export default PlayerSummary;
