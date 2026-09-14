import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/data-context';
import { liveSessionStore } from '../lib/liveSessionStore';
import { useActiveLiveSession } from '../components/LiveSession/useActiveLiveSession';
import { TeamPill } from '../components/LiveSession/TeamBits';
import { deriveSessionStats, sessionStandings, teamRecord } from '../utils/liveStats';
import { formatDate } from '../utils/calculations';
import { shortName } from '../utils/names';
import PageHeader from '../components/ui/PageHeader';
import Avatar from '../components/ui/Avatar';

const POLL_MS = 20000;

/** /live — read-only view of tonight for people on the bench. Realtime when enabled, polling otherwise. */
const LivePage = () => {
  const { players } = useData();
  const active = useActiveLiveSession();
  const [games, setGames] = useState([]);
  const [roster, setRoster] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);

  const sessionId = active.session && !active.isStale ? active.session.id : null;

  useEffect(() => {
    if (!sessionId) return undefined;
    let stopped = false;

    const load = async () => {
      try {
        const loaded = await liveSessionStore.loadSession(sessionId);
        if (stopped) return;
        setGames(loaded.games);
        setRoster(loaded.roster);
        setUpdatedAt(new Date());
      } catch (error) {
        console.error('Live refresh failed:', error);
      }
    };

    load();
    const unsubscribe = liveSessionStore.subscribeToGames(sessionId, load);
    const timer = window.setInterval(load, POLL_MS);
    return () => {
      stopped = true;
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [sessionId]);

  const standings = useMemo(() => sessionStandings(deriveSessionStats(games, roster)), [games, roster]);
  const pictureFor = (name) => players.find((p) => p.name === name)?.pictureUrl;

  if (active.loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Live" />
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Live" />
        <p className="px-5 pt-6 text-ink-2">Nobody's playing right now.</p>
        <Link to="/" className="inline-block px-5 pt-3 text-sm font-semibold text-accent">See the standings</Link>
      </div>
    );
  }

  const session = active.session;
  const a = teamRecord(games, 'team_a');
  const b = teamRecord(games, 'team_b');

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={`Game ${games.length + 1}`}
        eyebrow={
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Live · {formatDate(session.date)}
            {session.location ? ` · ${session.location}` : ''}
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3 px-5 pt-3">
        <div className="bg-surface rounded-2xl px-4 py-3 flex items-center justify-between">
          <TeamPill team="team_a" />
          <span className="display text-3xl text-ink">{a.wins}–{a.losses}</span>
        </div>
        <div className="bg-surface rounded-2xl px-4 py-3 flex items-center justify-between">
          <TeamPill team="team_b" />
          <span className="display text-3xl text-ink">{b.wins}–{b.losses}</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <span className="eyebrow">Tonight</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3 tabular">
          {games.length} {games.length === 1 ? 'game' : 'games'}
        </span>
      </div>

      {standings.map((p, i) => (
        <div key={p.name} className="flex items-center gap-3 h-[56px] px-5 border-t border-line">
          <span className={`display w-[26px] text-[22px] leading-none ${i < 3 && p.gamesPlayed > 0 ? 'text-accent' : 'text-ink-3'}`}>{i + 1}</span>
          <Avatar name={p.name} pictureUrl={pictureFor(p.name)} size={32} />
          <span className="flex-1 text-[16px] font-semibold text-ink truncate">{shortName(p.name, roster)}</span>
          <span className="text-xs text-ink-2 tabular">{p.gamesWon}–{p.gamesPlayed - p.gamesWon}</span>
          <span className="display w-14 text-right text-2xl text-ink">
            {p.gamesPlayed ? `${Math.round((p.gamesWon / p.gamesPlayed) * 100)}%` : '—'}
          </span>
        </div>
      ))}

      {games.length > 0 && (
        <>
          <div className="px-5 pt-6 pb-2 eyebrow border-t border-line mt-0">Results</div>
          {[...games].reverse().map((g) => (
            <div key={g.id || g.game_number} className="flex items-center gap-3 h-11 px-5">
              <span className="text-xs font-semibold text-ink-3 tabular w-16">Game {g.game_number}</span>
              <TeamPill team={g.winning_team} />
              <span className="text-xs text-ink-2">won</span>
              <span className="flex-1" />
              {g.played_at && (
                <span className="text-xs text-ink-3 tabular">
                  {new Date(g.played_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
              )}
            </div>
          ))}
        </>
      )}

      <p className="px-5 pt-6 text-[11px] text-ink-3">
        {updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Loading…'}
      </p>
    </div>
  );
};

export default LivePage;
