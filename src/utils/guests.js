/**
 * Guests are outsiders who join a run. They live only inside the night they
 * played: no profile, never in the standings, never in the average that sets
 * the games minimum. Anyone named "Guest …" or "Random …" counts as one, so
 * the old Random 1/2/3 profiles drop off the board without touching data.
 */
export const GUEST_PATTERN = /^(guest|random)\b/i;

/** Accepts a name or a player-like object ({ name, guest? }). */
export const isGuest = (playerOrName) => {
  if (!playerOrName) return false;
  if (typeof playerOrName === 'object' && playerOrName.guest === true) return true;
  const name = typeof playerOrName === 'string' ? playerOrName : playerOrName.name;
  return GUEST_PATTERN.test(String(name || '').trim());
};

export const onlyRegulars = (players) => players.filter((p) => !isGuest(p));

/** "Guest 1", "Guest 2", … skipping labels already in the roster. */
export const nextGuestName = (roster = []) => {
  const taken = new Set(roster.map((n) => String(n).trim().toLowerCase()));
  let n = 1;
  while (taken.has(`guest ${n}`)) n += 1;
  return `Guest ${n}`;
};

/**
 * Every guest line across sessions, added up. Guests are different people on
 * different nights, so this is a record for "outsiders as a group", never a
 * ranked player.
 * @param {Array} sessions - session rows with a players list
 * @returns {{ gamesPlayed, gamesWon, winPercentage, appearances, nights }}
 *   nights: one entry per session that had a guest, oldest first
 */
export const aggregateGuests = (sessions = []) => {
  const nights = [];

  for (const session of sessions) {
    const guests = (session.players || [])
      .filter((p) => isGuest(p))
      .map((p) => ({ name: p.name, gamesPlayed: p.gamesPlayed || 0, gamesWon: p.gamesWon || 0 }));
    if (guests.length === 0) continue;

    const gamesPlayed = guests.reduce((sum, g) => sum + g.gamesPlayed, 0);
    const gamesWon = guests.reduce((sum, g) => sum + g.gamesWon, 0);
    nights.push({
      key: String(session.id || session.date),
      date: session.date,
      location: session.location || null,
      guests,
      gamesPlayed,
      gamesWon,
      winPercentage: gamesPlayed ? gamesWon / gamesPlayed : 0
    });
  }

  nights.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const gamesPlayed = nights.reduce((sum, n) => sum + n.gamesPlayed, 0);
  const gamesWon = nights.reduce((sum, n) => sum + n.gamesWon, 0);
  return {
    gamesPlayed,
    gamesWon,
    winPercentage: gamesPlayed ? gamesWon / gamesPlayed : 0,
    appearances: nights.reduce((sum, n) => sum + n.guests.length, 0),
    nights
  };
};
