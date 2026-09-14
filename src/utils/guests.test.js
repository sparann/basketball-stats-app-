import { describe, it, expect } from 'vitest';
import { isGuest, nextGuestName, onlyRegulars } from './guests';
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
