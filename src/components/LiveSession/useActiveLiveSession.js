import { useCallback, useEffect, useState } from 'react';
import { liveSessionStore } from '../../lib/liveSessionStore';

const STALE_AFTER_HOURS = 12;

const EMPTY = { loading: true, session: null, gameCount: 0, startedAt: null, isStale: false };

/** Staleness is worked out when the session is fetched, so render stays pure. */
const describe = (found) => {
  if (!found) return { ...EMPTY, loading: false };
  const { session, gameCount } = found;
  const startedAt = new Date(session.started_at || session.created_at);
  const valid = !Number.isNaN(startedAt.getTime());
  const isStale = valid && (Date.now() - startedAt.getTime()) / 36e5 > STALE_AFTER_HOURS;
  return { loading: false, session, gameCount, startedAt: valid ? startedAt : null, isStale };
};

/**
 * The most recent live session that was never ended, if any.
 * `isStale` means it started long enough ago that it was almost certainly
 * forgotten rather than paused. Call `refresh()` after changing sessions.
 */
export const useActiveLiveSession = () => {
  const [state, setState] = useState(EMPTY);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    liveSessionStore
      .findActiveSession()
      .then((found) => {
        if (!cancelled) setState(describe(found));
      })
      .catch(() => {
        if (!cancelled) setState({ ...EMPTY, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { ...state, refresh };
};
