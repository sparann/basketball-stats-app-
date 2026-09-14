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
  if (percentage === 1) return 'perfect';
  if (percentage > 0.75) return 'excellent';
  if (percentage >= 0.5) return 'good';
  if (percentage > 0.25) return 'fair';
  return 'poor';
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
 * Parse a YYYY-MM-DD string as a local date.
 * new Date('YYYY-MM-DD') parses as UTC midnight, which is the previous evening
 * in US time zones, so every date comparison has to go through this.
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Date|null} Local date, or null for empty input
 */
export const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = String(dateString).slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Format date string (timezone-safe)
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date or N/A
 */
export const formatDate = (dateString) => {
  const date = parseLocalDate(dateString);
  if (!date) return 'N/A';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Check if player is active (played in last 14 days)
 * @param {string} lastPlayedDate - Last played date
 * @returns {boolean} True if active
 */
export const isPlayerActive = (lastPlayedDate) => {
  const lastPlayed = parseLocalDate(lastPlayedDate);
  if (!lastPlayed) return false;
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  return lastPlayed >= fourteenDaysAgo;
};

/**
 * Calculate dynamic minimum games threshold
 * @param {Array} players - Array of player objects
 * @returns {number} Minimum games required for standings
 */
export const calculateMinimumGamesThreshold = (players) => {
  if (players.length === 0) return 5;

  const averageGames = players.reduce((sum, p) => sum + p.totalGamesPlayed, 0) / players.length;

  // 40% of average games, min 5, max 20
  return Math.max(5, Math.min(20, Math.floor(averageGames * 0.4)));
};

/**
 * Categorize players into standings groups
 * @param {Array} players - Array of player objects
 * @param {number} minimumGames - Minimum games threshold
 * @returns {Object} Object with active, needsMoreGames, and inactive arrays
 */
export const categorizePlayersByStanding = (players, minimumGames) => {
  const MINIMUM_SESSIONS = 2; // Require at least 2 sessions to avoid one-offs

  const active = [];
  const needsMoreGames = [];
  const inactive = [];

  players.forEach(player => {
    const meetsGamesThreshold = player.totalGamesPlayed >= minimumGames;
    const meetsSessionsThreshold = player.sessionsAttended >= MINIMUM_SESSIONS;
    const isActive = isPlayerActive(player.lastPlayed);

    if (!isActive) {
      inactive.push(player);
    } else if (meetsGamesThreshold && meetsSessionsThreshold) {
      active.push(player);
    } else {
      needsMoreGames.push(player);
    }
  });

  return { active, needsMoreGames, inactive };
};

/**
 * Everything the standings screens need in one call: the dynamic threshold,
 * the three groups, and dense ranks for the active group.
 * @param {Array} players - Player objects with aggregated stats
 * @param {string} sortBy - 'winPercentage' | 'totalGames'
 */
export const computeStandings = (players, sortBy = 'winPercentage') => {
  const minimumGames = calculateMinimumGamesThreshold(players);
  const groups = categorizePlayersByStanding(players, minimumGames);
  const active = sortPlayers(groups.active, sortBy);

  let rank = 1;
  const ranked = active.map((player, index) => {
    if (index > 0) {
      const previous = active[index - 1];
      const tied = sortBy === 'winPercentage'
        ? player.overallWinPercentage === previous.overallWinPercentage
        : player.totalGamesPlayed === previous.totalGamesPlayed;
      if (!tied) rank++;
    }
    return { ...player, rank };
  });

  return {
    minimumGames,
    active: ranked,
    needsMoreGames: sortPlayers(groups.needsMoreGames, sortBy),
    inactive: sortPlayers(groups.inactive, sortBy)
  };
};

/** Total games in a session: the recorded total, or the most any one player played. */
export const getSessionTotalGames = (session) =>
  session.totalGames || Math.max(0, ...(session.players || []).map((p) => p.gamesPlayed));

/**
 * Session MVP(s): best win rate among players who played at least half the games.
 * Returns an array because ties are common in a 10-game night.
 */
export const getSessionTopPerformers = (session) => {
  const totalGames = getSessionTotalGames(session);
  const eligible = (session.players || [])
    .filter((p) => p.gamesPlayed >= totalGames * 0.5)
    .map((p) => ({ ...p, winPercentage: calculateWinPercentage(p.gamesWon, p.gamesPlayed) }));

  if (eligible.length === 0) return [];
  const best = Math.max(...eligible.map((p) => p.winPercentage));
  return eligible.filter((p) => p.winPercentage === best);
};
