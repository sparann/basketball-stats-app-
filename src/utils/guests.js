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
