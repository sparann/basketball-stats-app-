import { describe, it, expect } from 'vitest';
import { aggregateGuests, isGuest, nextGuestName, onlyRegulars } from './guests';
import { shortName } from './names';
import { getSessionTopPerformers } from './calculations';

describe('isGuest', () => {
  it('matches Guest and Random labels, case-insensitively, and the guest flag', () => {
    expect(isGuest('Guest 1')).toBe(true);
    expect(isGuest('random 3')).toBe(true);
    expect(isGuest({ name: 'Somebody', guest: true })).toBe(true);
    expect(isGuest('Randolph Carter')).toBe(false);
    expect(isGuest('Marcus Jones')).toBe(false);
    expect(isGuest(null)).toBe(false);
  });

  it('filters regulars', () => {
    expect(onlyRegulars([{ name: 'A' }, { name: 'Guest 2' }, { name: 'Random 1' }]).map((p) => p.name)).toEqual(['A']);
  });
});

describe('nextGuestName', () => {
  it('fills the first free number', () => {
    expect(nextGuestName([])).toBe('Guest 1');
    expect(nextGuestName(['Guest 1', 'Kai'])).toBe('Guest 2');
    expect(nextGuestName(['guest 1', 'Guest 3'])).toBe('Guest 2');
  });
});

describe('guests elsewhere', () => {
  it('keep their whole label in shortName', () => {
    expect(shortName('Guest 2', ['Guest 1', 'Guest 2'])).toBe('Guest 2');
    expect(shortName('Random 1', ['Random 1'])).toBe('Random 1');
  });

  it('cannot be MVP even on a perfect night', () => {
    const session = {
      date: '2026-09-12',
      players: [
        { name: 'Guest 1', gamesPlayed: 8, gamesWon: 8 },
        { name: 'Wyatt', gamesPlayed: 8, gamesWon: 6 }
      ]
    };
    expect(getSessionTopPerformers(session).map((p) => p.name)).toEqual(['Wyatt']);
  });
});

describe('aggregateGuests', () => {
  const sessions = [
    {
      id: 's2',
      date: '2026-09-12',
      location: 'Provo Rec Center',
      players: [
        { name: 'Wyatt', gamesPlayed: 8, gamesWon: 6 },
        { name: 'Guest 1', gamesPlayed: 5, gamesWon: 2 },
        { name: 'Guest 2', gamesPlayed: 3, gamesWon: 3 }
      ]
    },
    { id: 's3', date: '2026-09-19', players: [{ name: 'Wyatt', gamesPlayed: 8, gamesWon: 4 }] },
    {
      id: 's1',
      date: '2026-09-05',
      players: [
        { name: 'Random 1', gamesPlayed: 4, gamesWon: 1 },
        { name: 'Dev', gamesPlayed: 4, gamesWon: 3, guest: true }
      ]
    }
  ];

  it('adds up every guest line and skips nights without guests', () => {
    const totals = aggregateGuests(sessions);
    expect(totals).toMatchObject({ gamesPlayed: 16, gamesWon: 9, appearances: 4 });
    expect(totals.winPercentage).toBeCloseTo(9 / 16);
    expect(totals.nights.map((n) => n.key)).toEqual(['s1', 's2']);
  });

  it('keeps each night separate, oldest first', () => {
    const [first, second] = aggregateGuests(sessions).nights;
    expect(first).toMatchObject({ date: '2026-09-05', gamesPlayed: 8, gamesWon: 4 });
    expect(second.guests.map((g) => g.name)).toEqual(['Guest 1', 'Guest 2']);
    expect(second.winPercentage).toBeCloseTo(5 / 8);
  });

  it('is empty with no sessions', () => {
    expect(aggregateGuests([])).toMatchObject({ gamesPlayed: 0, appearances: 0, nights: [] });
  });
});
