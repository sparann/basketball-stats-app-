import { describe, it, expect } from 'vitest';
import {
  parseLocalDate,
  formatDate,
  isPlayerActive,
  calculateMinimumGamesThreshold,
  categorizePlayersByStanding,
  computeStandings,
  aggregatePlayerStats,
  getSessionTotalGames,
  getSessionTopPerformers
} from './calculations';

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const player = (name, played, won, sessions, lastPlayed) => ({
  name,
  totalGamesPlayed: played,
  totalGamesWon: won,
  sessionsAttended: sessions,
  overallWinPercentage: played ? won / played : 0,
  lastPlayed
});

describe('dates', () => {
  it('parses YYYY-MM-DD as a local date, not UTC midnight', () => {
    const d = parseLocalDate('2026-09-12');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 8, 12]);
    expect(parseLocalDate('')).toBeNull();
  });

  it('formats without shifting the day', () => {
    expect(formatDate('2026-09-12')).toBe('Sep 12, 2026');
    expect(formatDate(null)).toBe('N/A');
  });

  it('treats 14 days as the activity window', () => {
    expect(isPlayerActive(daysAgo(0))).toBe(true);
    expect(isPlayerActive(daysAgo(13))).toBe(true);
    expect(isPlayerActive(daysAgo(20))).toBe(false);
    expect(isPlayerActive(null)).toBe(false);
  });
});

describe('minimum games threshold', () => {
  it('is 40% of the average, clamped between 5 and 20', () => {
    expect(calculateMinimumGamesThreshold([])).toBe(5);
    expect(calculateMinimumGamesThreshold([player('a', 10, 5, 2, null)])).toBe(5);
    expect(calculateMinimumGamesThreshold([player('a', 30, 15, 2, null)])).toBe(12);
    expect(calculateMinimumGamesThreshold([player('a', 200, 100, 2, null)])).toBe(20);
  });
});

describe('standings groups and ranks', () => {
  const players = [
    player('Top', 40, 30, 5, daysAgo(2)),
    player('Tied', 40, 30, 5, daysAgo(2)),
    player('Third', 40, 20, 5, daysAgo(2)),
    player('Rookie', 3, 3, 1, daysAgo(1)),
    player('Gone', 50, 25, 8, daysAgo(30))
  ];

  it('splits active, needs-more-games and inactive', () => {
    const groups = categorizePlayersByStanding(players, 10);
    expect(groups.active.map((p) => p.name).sort()).toEqual(['Third', 'Tied', 'Top']);
    expect(groups.needsMoreGames.map((p) => p.name)).toEqual(['Rookie']);
    expect(groups.inactive.map((p) => p.name)).toEqual(['Gone']);
  });

  it('gives tied players the same dense rank', () => {
    const { active } = computeStandings(players);
    expect(active.map((p) => [p.name, p.rank])).toEqual([
      ['Top', 1],
      ['Tied', 1],
      ['Third', 2]
    ]);
  });
});

describe('sessions', () => {
  const session = {
    date: '2026-09-12',
    players: [
      { name: 'A', gamesPlayed: 10, gamesWon: 8 },
      { name: 'B', gamesPlayed: 4, gamesWon: 4 },
      { name: 'C', gamesPlayed: 10, gamesWon: 8 }
    ]
  };

  it('aggregates across sessions and keeps last played', () => {
    const stats = aggregatePlayerStats([session, { date: '2026-09-19', players: [{ name: 'A', gamesPlayed: 5, gamesWon: 1 }] }]);
    const a = stats.find((p) => p.name === 'A');
    expect(a).toMatchObject({ totalGamesPlayed: 15, totalGamesWon: 9, sessionsAttended: 2, lastPlayed: '2026-09-19' });
  });

  it('falls back to the most games any player played for the total', () => {
    expect(getSessionTotalGames(session)).toBe(10);
    expect(getSessionTotalGames({ ...session, totalGames: 12 })).toBe(12);
  });

  it('needs half the games to be MVP, and returns ties', () => {
    expect(getSessionTopPerformers(session).map((p) => p.name)).toEqual(['A', 'C']);
  });
});
