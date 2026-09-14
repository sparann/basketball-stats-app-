import { describe, it, expect } from 'vitest';
import {
  deriveSessionStats,
  teamRecord,
  winStreak,
  lineupFromGames,
  lineupProblem,
  matchupStatus,
  sessionStandings,
  TEAM_CAP
} from './liveStats';

const game = (n, a, b, winner) => ({ game_number: n, team_a_players: a, team_b_players: b, winning_team: winner });

const games = [
  game(1, ['Wyatt', 'Trey'], ['Dev', 'Sam'], 'team_a'),
  game(2, ['Wyatt', 'Trey'], ['Dev', 'Kai'], 'team_b'),
  game(3, ['Wyatt', 'Kai'], ['Dev', 'Trey'], 'team_b')
];

describe('deriveSessionStats', () => {
  it('counts games and wins per player from the rows', () => {
    const stats = Object.fromEntries(deriveSessionStats(games).map((p) => [p.name, p]));
    expect(stats.Wyatt).toMatchObject({ gamesPlayed: 3, gamesWon: 1 });
    expect(stats.Dev).toMatchObject({ gamesPlayed: 3, gamesWon: 2 });
    expect(stats.Sam).toMatchObject({ gamesPlayed: 1, gamesWon: 0 });
  });

  it('includes roster players who have not played yet', () => {
    const stats = deriveSessionStats([], ['Ben']);
    expect(stats).toEqual([{ name: 'Ben', gamesPlayed: 0, gamesWon: 0 }]);
  });
});

describe('teamRecord and winStreak', () => {
  it('reads team records off the winners', () => {
    expect(teamRecord(games, 'team_a')).toEqual({ wins: 1, losses: 2 });
    expect(teamRecord(games, 'team_b')).toEqual({ wins: 2, losses: 1 });
  });

  it('counts a streak back from the latest game only', () => {
    expect(winStreak(games, 'team_b')).toBe(2);
    expect(winStreak(games, 'team_a')).toBe(0);
    expect(winStreak([], 'team_a')).toBe(0);
  });
});

describe('lineupFromGames', () => {
  it('puts everyone on the bench before the first game', () => {
    expect(lineupFromGames([], ['A', 'B'])).toEqual({ teamA: [], teamB: [], bench: ['A', 'B'] });
  });

  it('restores the last game and benches the rest, dropping names no longer on the roster', () => {
    const roster = ['Wyatt', 'Kai', 'Dev', 'Trey', 'Ben'];
    expect(lineupFromGames(games, roster)).toEqual({
      teamA: ['Wyatt', 'Kai'],
      teamB: ['Dev', 'Trey'],
      bench: ['Ben']
    });
  });
});

describe('lineupProblem', () => {
  const roster = ['A', 'B', 'C', 'D', 'E'];

  it('accepts equal teams that cover the roster', () => {
    expect(lineupProblem({ teamA: ['A', 'B'], teamB: ['C', 'D'], bench: ['E'] }, roster)).toBeNull();
  });

  it('rejects unequal teams, duplicates, missing and unknown players, and oversize teams', () => {
    expect(lineupProblem({ teamA: ['A'], teamB: ['C', 'D'], bench: ['B', 'E'] }, roster)).toMatch(/same size/);
    expect(lineupProblem({ teamA: ['A', 'A'], teamB: ['C', 'D'], bench: ['B', 'E'] }, roster)).toMatch(/twice/);
    expect(lineupProblem({ teamA: ['A', 'B'], teamB: ['C', 'D'], bench: [] }, roster)).toMatch(/missing/);
    expect(lineupProblem({ teamA: ['A', 'Z'], teamB: ['C', 'D'], bench: ['B', 'E'] }, roster)).toMatch(/not in this session/);

    const big = Array.from({ length: (TEAM_CAP + 1) * 2 }, (_, i) => `P${i}`);
    const half = big.length / 2;
    expect(lineupProblem({ teamA: big.slice(0, half), teamB: big.slice(half), bench: [] }, big)).toMatch(/capped/);
  });
});

describe('matchupStatus', () => {
  it('says who needs how many', () => {
    expect(matchupStatus(['a', 'b', 'c', 'd', 'e'], ['f', 'g', 'h'])).toEqual({ text: '5 v 3 · Dark needs 2 more', ready: false });
    expect(matchupStatus(['a'], ['b', 'c'])).toEqual({ text: '1 v 2 · Light needs 1 more', ready: false });
  });

  it('is ready only when equal, non-empty and under the cap', () => {
    expect(matchupStatus(['a', 'b'], ['c', 'd'])).toEqual({ text: '2 v 2 · Ready', ready: true });
    expect(matchupStatus([], []).ready).toBe(false);
    expect(matchupStatus(Array(6).fill('x'), Array(6).fill('y')).text).toMatch(/too many/);
  });
});

describe('sessionStandings', () => {
  it('sorts by win rate, then wins, then name', () => {
    const order = sessionStandings([
      { name: 'Zed', gamesPlayed: 2, gamesWon: 1 },
      { name: 'Amy', gamesPlayed: 2, gamesWon: 1 },
      { name: 'Bob', gamesPlayed: 4, gamesWon: 2 },
      { name: 'Cal', gamesPlayed: 1, gamesWon: 1 },
      { name: 'Dee', gamesPlayed: 0, gamesWon: 0 }
    ]).map((p) => p.name);
    expect(order).toEqual(['Cal', 'Bob', 'Amy', 'Zed', 'Dee']);
  });
});
