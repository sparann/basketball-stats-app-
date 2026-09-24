import { Link } from 'react-router-dom';
import { useActiveLiveSession } from '../LiveSession/useActiveLiveSession';

/** Pulsing LIVE pill that links to the spectator page while a session is running. */
const LiveBadge = () => {
  const live = useActiveLiveSession();
  if (!live.session || live.isStale) return null;
  return (
    <Link
      to="/live"
      className="h-6 px-2.5 rounded-full border border-line-strong flex items-center gap-1.5 text-[11px] font-bold tracking-[0.1em] text-accent"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
      LIVE
    </Link>
  );
};

export default LiveBadge;
