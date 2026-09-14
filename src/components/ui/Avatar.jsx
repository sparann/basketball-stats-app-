const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase();

/** Circular photo or initials. `size` is in px. */
const Avatar = ({ name, pictureUrl, size = 36, className = '' }) => {
  const style = { width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.36)) };

  if (pictureUrl) {
    return (
      <img
        src={pictureUrl}
        alt=""
        style={style}
        className={`rounded-full object-cover bg-surface-2 shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      style={style}
      className={`rounded-full bg-surface-2 text-ink-2 font-semibold flex items-center justify-center shrink-0 ${className}`}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
};

export default Avatar;
