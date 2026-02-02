/**
 * Calculate win percentage
 * @param {number} won - Games won
 * @param {number} played - Games played
 * @returns {number} Win percentage (0-1)
 */
export const calculateWinPercentage = (won, played) => {
  if (played === 0) return 0;
  return won / played;
};

/**
 * Format win percentage as a string
 * @param {number} percentage - Win percentage (0-1)
 * @param {number} gamesPlayed - Total games played (optional)
 * @returns {string} Formatted percentage or N/A
 */
export const formatWinPercentage = (percentage, gamesPlayed) => {
  if (gamesPlayed === 0) return 'N/A';
  return `${(percentage * 100).toFixed(1)}%`;
};

/**
 * Get color coding for win percentage
 * @param {number} percentage - Win percentage (0-1)
 * @param {number} gamesPlayed - Total games played (optional)
 * @returns {string} Color class name
 */
export const getWinPercentageColor = (percentage, gamesPlayed) => {
  if (gamesPlayed === 0) return 'default';
  if (percentage > 0.7) return 'success';
  if (percentage >= 0.5) return 'warning';
  return 'danger';
};

/**
 * Aggregate player stats across all sessions
 * @param {Array} sessions - Array of session objects
 * @returns {Array} Array of player objects with aggregated stats
 */
export const aggregatePlayerStats = (sessions) => {
  const playerMap = new Map();

  sessions.forEach((session) => {
    session.players.forEach((player) => {
      if (!playerMap.has(player.name)) {
        playerMap.set(player.name, {
          name: player.name,
          totalGamesPlayed: 0,
          totalGamesWon: 0,
          sessionsAttended: 0,
          lastPlayed: null,
          sessions: []
        });
      }

      const playerData = playerMap.get(player.name);
      playerData.totalGamesPlayed += player.gamesPlayed;
      playerData.totalGamesWon += player.gamesWon;
      playerData.sessionsAttended += 1;
      playerData.lastPlayed = session.date;
      playerData.sessions.push({
        date: session.date,
        gamesPlayed: player.gamesPlayed,
        gamesWon: player.gamesWon,
        winPercentage: calculateWinPercentage(player.gamesWon, player.gamesPlayed),
        notes: player.notes
      });
    });
  });

  return Array.from(playerMap.values()).map((player) => ({
    ...player,
    overallWinPercentage: calculateWinPercentage(
      player.totalGamesWon,
      player.totalGamesPlayed
    )
  }));
};

/**
 * Get all sessions for a specific player
 * @param {Array} sessions - Array of session objects
 * @param {string} playerName - Player's name
 * @returns {Array} Array of session data for the player
 */
export const getPlayerSessions = (sessions, playerName) => {
  const playerSessions = [];

  sessions.forEach((session) => {
    const player = session.players.find((p) => p.name === playerName);
    if (player) {
      playerSessions.push({
        date: session.date,
        gamesPlayed: player.gamesPlayed,
        gamesWon: player.gamesWon,
        winPercentage: calculateWinPercentage(player.gamesWon, player.gamesPlayed),
        notes: player.notes
      });
    }
  });

  return playerSessions;
};

/**
 * Sort players by various criteria
 * @param {Array} players - Array of player objects
 * @param {string} sortBy - Sort criteria ('winPercentage', 'totalGames', 'lastPlayed')
 * @returns {Array} Sorted array of players
 */
export const sortPlayers = (players, sortBy) => {
  const sorted = [...players];

  switch (sortBy) {
    case 'winPercentage':
      return sorted.sort((a, b) => b.overallWinPercentage - a.overallWinPercentage);
    case 'totalGames':
      return sorted.sort((a, b) => b.totalGamesPlayed - a.totalGamesPlayed);
    case 'lastPlayed':
      return sorted.sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed));
    default:
      return sorted;
  }
};

/**
 * Format date string
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date or N/A
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Check if player is active (played in last 30 days)
 * @param {string} lastPlayedDate - Last played date
 * @returns {boolean} True if active
 */
export const isPlayerActive = (lastPlayedDate) => {
  if (!lastPlayedDate) return false;
  const lastPlayed = new Date(lastPlayedDate);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return lastPlayed >= thirtyDaysAgo;
};
