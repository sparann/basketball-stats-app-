/**
 * First name, plus a last initial when two players share a first name.
 * "Marcus Jones" -> "Marcus", or "Marcus J." if there is also a Marcus Lee.
 */
export const shortName = (fullName, allNames = []) => {
  const parts = String(fullName || '').trim().split(/\s+/);
  const first = parts[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1] : '';

  const clashes = allNames.filter(
    (name) => String(name).trim().split(/\s+/)[0].toLowerCase() === first.toLowerCase()
  ).length;

  return clashes > 1 && last ? `${first} ${last[0]}.` : first;
};
