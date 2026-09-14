/**
 * Pure helpers for a live session. Everything is derived from the game rows,
 * so there are no counters to keep in step.
 */

/** Database keys stay team_a / team_b; players see Light / Dark shirts. */
export const TEAM_LABELS = { team_a: 'Light', team_b: 'Dark' };

/** Wyatt's rule: pickup runs 5-on-5 at most. Keep the cap. */
export const TEAM_CAP = 5;

export const TEAMS = ['team_a', 'team_b'];

export const otherTeam = (team) => (team === 'team_a' ? 'team_b' : 'team_a');

/** Lineup key (teamA / teamB) for a database team key. */
export const lineupKey = (team) => (team === 'team_a' ? 'teamA' : 'teamB');

/**
 * Per-player games played and won from game rows.
 * @param {Array} games - rows with team_a_players, team_b_players, winning_team
 * @param {string[]} roster - names to include even with zero games
 */
export const deriveSessionStats = (games, roster = []) => {
  const stats = new Map(roster.map((name) => [name, { name, gamesPlayed: 0, gamesWon: 0 }]));

  for (const game of games) {
    for (const team of TEAMS) {
      const names = team === 'team_a' ? game.team_a_players : game.team_b_players;
      for (const name of names || []) {
        if (!stats.has(name)) stats.set(name, { name, gamesPlayed: 0, gamesWon: 0 });
        const entry = stats.get(name);
        entry.gamesPlayed += 1;
        if (game.winning_team === team) entry.gamesWon += 1;
      }
    }
  }

  return [...stats.values()];
};

/** Wins and losses for one shirt colour across the session. */
export const teamRecord = (games, team) => ({
  wins: games.filter((g) => g.winning_team === team).length,
  losses: games.filter((g) => g.winning_team === otherTeam(team)).length
});

/** Consecutive wins for a team counting back from the latest game. */
export const winStreak = (games, team) => {
  let streak = 0;
  for (let i = games.length - 1; i >= 0; i--) {
    if (games[i].winning_team !== team) break;
    streak += 1;
  }
  return streak;
};

/** Players sorted for a session leaderboard: win rate, then wins, then name. */
export const sessionStandings = (players) =>
  [...players].sort((a, b) => {
    const aRate = a.gamesPlayed ? a.gamesWon / a.gamesPlayed : 0;
    const bRate = b.gamesPlayed ? b.gamesWon / b.gamesPlayed : 0;
    return bRate - aRate || b.gamesWon - a.gamesWon || a.name.localeCompare(b.name);
  });

/**
 * Who was on the floor for the last game, with everyone else on the bench.
 * With no games yet, everyone is on the bench and teams still need picking.
 */
export const lineupFromGames = (games, roster) => {
  const last = games[games.length - 1];
  if (!last) return { teamA: [], teamB: [], bench: [...roster] };

  const teamA = (last.team_a_players || []).filter((n) => roster.includes(n));
  const teamB = (last.team_b_players || []).filter((n) => roster.includes(n));
  const onFloor = new Set([...teamA, ...teamB]);
  return { teamA, teamB, bench: roster.filter((n) => !onFloor.has(n)) };
};

/**
 * Validate a proposed lineup against the roster.
 * Returns null when valid, otherwise a short reason.
 */
export const lineupProblem = ({ teamA, teamB, bench }, roster) => {
  const all = [...teamA, ...teamB, ...bench];
  if (new Set(all).size !== all.length) return 'A player is listed twice';
  if (all.some((n) => !roster.includes(n))) return 'A player is not in this session';
  if (new Set(all).size !== roster.length) return 'Someone is missing from the lineup';
  if (teamA.length === 0 || teamB.length === 0) return 'Both teams need players';
  if (teamA.length !== teamB.length) return 'Teams must be the same size';
  if (teamA.length > TEAM_CAP) return `Teams are capped at ${TEAM_CAP}`;
  return null;
};

/** Human line for the rotation screen: "5 v 3 · Dark needs 2 more". */
export const matchupStatus = (teamA, teamB) => {
  const a = teamA.length;
  const b = teamB.length;
  const base = `${a} v ${b}`;
  if (a > TEAM_CAP || b > TEAM_CAP) {
    const over = a > TEAM_CAP ? 'team_a' : 'team_b';
    return { text: `${base} · ${TEAM_LABELS[over]} has too many (max ${TEAM_CAP})`, ready: false };
  }
  if (a === 0 || b === 0) return { text: `${base} · both teams need players`, ready: false };
  if (a === b) return { text: `${base} · Ready`, ready: true };
  const short = a < b ? 'team_a' : 'team_b';
  const diff = Math.abs(a - b);
  return { text: `${base} · ${TEAM_LABELS[short]} needs ${diff} more`, ready: false };
};
