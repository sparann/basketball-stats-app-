import { useState } from 'react';
import {
  formatDate,
  formatWinPercentage,
  calculateWinPercentage,
  getWinPercentageColor
} from '../utils/calculations';

const SessionLog = ({ sessions }) => {
  const [sortColumn, setSortColumn] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterPlayer, setFilterPlayer] = useState('');
  const [showNotes, setShowNotes] = useState(true);

  // Flatten sessions into individual rows
  const flattenedSessions = [];
  sessions.forEach((session) => {
    session.players.forEach((player) => {
      flattenedSessions.push({
        date: session.date,
        playerName: player.name,
        gamesPlayed: player.gamesPlayed,
        gamesWon: player.gamesWon,
        winPercentage: calculateWinPercentage(player.gamesWon, player.gamesPlayed),
        notes: player.notes
      });
    });
  });

  // Get unique player names for filter
  const playerNames = [...new Set(flattenedSessions.map((s) => s.playerName))].sort();

  // Filter by player
  let filteredSessions = filterPlayer
    ? flattenedSessions.filter((s) => s.playerName === filterPlayer)
    : flattenedSessions;

  // Sort sessions
  filteredSessions.sort((a, b) => {
    let aValue = a[sortColumn];
    let bValue = b[sortColumn];

    if (sortColumn === 'date') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Player Name', 'Games Played', 'Games Won', 'Win %', 'Notes'];
    const rows = filteredSessions.map((s) => [
      s.date,
      s.playerName,
      s.gamesPlayed,
      s.gamesWon,
      formatWinPercentage(s.winPercentage),
      s.notes
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'basketball_stats.csv';
    a.click();
  };

  return (
    <div className="session-log">
      <div className="log-controls">
        <div className="control-group">
          <label htmlFor="player-filter">Filter by player:</label>
          <select
            id="player-filter"
            value={filterPlayer}
            onChange={(e) => setFilterPlayer(e.target.value)}
          >
            <option value="">All Players</option>
            {playerNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="show-notes">
            <input
              type="checkbox"
              id="show-notes"
              checked={showNotes}
              onChange={(e) => setShowNotes(e.target.checked)}
            />
            Show notes
          </label>
        </div>

        <button onClick={exportToCSV} className="export-btn">
          Export to CSV
        </button>
      </div>

      <div className="table-container">
        <table className="session-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('date')} className="sortable">
                Date {sortColumn === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('playerName')} className="sortable">
                Player {sortColumn === 'playerName' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('gamesPlayed')} className="sortable">
                Games Played{' '}
                {sortColumn === 'gamesPlayed' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('gamesWon')} className="sortable">
                Games Won {sortColumn === 'gamesWon' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('winPercentage')} className="sortable">
                Win % {sortColumn === 'winPercentage' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              {showNotes && <th>Notes</th>}
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map((session, index) => (
              <tr key={index}>
                <td>{formatDate(session.date)}</td>
                <td className="player-name-cell">{session.playerName}</td>
                <td className="number-cell">{session.gamesPlayed}</td>
                <td className="number-cell">{session.gamesWon}</td>
                <td className={`number-cell ${getWinPercentageColor(session.winPercentage)}`}>
                  {formatWinPercentage(session.winPercentage)}
                </td>
                {showNotes && <td className="notes-cell">{session.notes}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        Showing {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default SessionLog;
