// One consistent stroke icon set. Draw, don't emoji.
const PATHS = {
  chevronDown: 'M6 9l6 6 6-6',
  chevronUp: 'M18 15l-6-6-6 6',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  x: 'M18 6L6 18M6 6l12 12',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12l5 5L20 7',
  info: 'M12 16v-4M12 8h.01',
  more: '',
  undo: 'M3 7v6h6M3.5 13a9 9 0 1 0 2.2-6.4L3 7',
  pin: 'M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z',
  list: 'M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01',
  rows: 'M4 6h16M4 12h16M4 18h16',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  calendar: 'M3 10h18M8 3v4M16 3v4',
  lock: 'M8 11V7a4 4 0 0 1 8 0v4',
  search: 'M21 21l-4.3-4.3',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  pencil: 'M4 20h4l10-10-4-4L4 16v4zM13 7l4 4',
  play: 'M7 5v14l12-7z',
  flag: 'M5 21V4h11l-1 4h5l-1 4H14l-1 4H5',
  logout: 'M15 17l5-5-5-5M20 12H9M13 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7',
  filter: 'M4 6h16M7 12h10M10 18h4',
  shuffle: 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 21h6M10 17h4',
  flame: 'M12 22c4.4 0 7-2.9 7-6.6 0-3.2-2.2-5.4-3.6-7.1-.4 1.6-1.3 2.6-2.4 3-.2-2.8-1.6-5.7-4.6-7.3.4 3-1 4.6-2.3 6.2C4.7 11.9 5 13.8 5 15.4 5 19.1 7.6 22 12 22z',
};

const EXTRAS = {
  info: <circle cx="12" cy="12" r="9" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  pin: <circle cx="12" cy="11" r="2" />,
  calendar: <rect x="3" y="5" width="18" height="16" rx="2" />,
  lock: <rect x="4" y="11" width="16" height="10" rx="2" />,
  search: <circle cx="11" cy="11" r="6.5" />,
  camera: <circle cx="12" cy="13" r="3" />,
};

const Icon = ({ name, size = 20, strokeWidth = 2, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {EXTRAS[name]}
    {PATHS[name] && <path d={PATHS[name]} />}
  </svg>
);

export default Icon;
