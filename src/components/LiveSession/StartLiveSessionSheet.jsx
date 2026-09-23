import { useMemo, useState } from 'react';
import { useData } from '../../context/data-context';
import { useUI } from '../../context/ui-context';
import { liveSessionStore } from '../../lib/liveSessionStore';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { isGuest } from '../../utils/guests';

const MIN_PLAYERS = 4;

const todayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Who's here tonight. Players sort by last played; "same crew" picks last time's group.
 * Mount it only while open so every opening starts fresh.
 */
const StartLiveSessionSheet = ({ onClose, onStarted }) => {
  const { players, sessions, locations } = useData();
  const { toast } = useUI();

  const lastSession = useMemo(
    () => [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null,
    [sessions]
  );

  const [date, setDate] = useState(todayString);
  const [location, setLocation] = useState(() => lastSession?.location || '');
  const [picked, setPicked] = useState(() => new Set());
  const [query, setQuery] = useState('');
  const [guestCount, setGuestCount] = useState(0);
  const [starting, setStarting] = useState(false);

  const headcount = picked.size + guestCount;

  const sorted = useMemo(
    () =>
      players.filter((p) => !isGuest(p)).sort((a, b) => {
        if (a.lastPlayed && b.lastPlayed) return a.lastPlayed < b.lastPlayed ? 1 : -1;
        if (a.lastPlayed) return -1;
        if (b.lastPlayed) return 1;
        return a.name.localeCompare(b.name);
      }),
    [players]
  );
  const shown = sorted.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));

  const toggle = (name) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const sameCrew = () => {
    if (!lastSession) return;
    const known = new Set(players.map((p) => p.name));
    setPicked(new Set(lastSession.players.map((p) => p.name).filter((n) => known.has(n) && !isGuest(n))));
  };

  const start = async () => {
    if (headcount < MIN_PLAYERS) return;
    setStarting(true);
    try {
      // Guests are per-night labels: no profile, never in the standings
      const guests = Array.from({ length: guestCount }, (_, i) => `Guest ${i + 1}`);
      const session = await liveSessionStore.createSession({ date, location, names: [...picked, ...guests] });
      onStarted(session);
    } catch (error) {
      toast(`Couldn't start the session: ${error.message}`, { type: 'error' });
      setStarting(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title="Live session" size="lg">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="eyebrow block mb-1.5">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-court border border-line text-[15px] font-medium text-ink focus:outline-none focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="eyebrow block mb-1.5">Court</span>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-court border border-line text-[15px] font-medium text-ink focus:outline-none focus:border-accent"
          >
            <option value="">No court</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between mt-4 mb-2">
        <span className="eyebrow">Who's here</span>
        <span className={`text-xs font-semibold tabular ${headcount >= MIN_PLAYERS ? 'text-accent' : 'text-ink-3'}`}>
          {headcount} tonight{headcount < MIN_PLAYERS ? ` · need ${MIN_PLAYERS}` : ''}
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="flex-1 h-10 px-3 rounded-xl bg-court border border-line text-sm font-medium text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
        />
        {lastSession && (
          <Button variant="secondary" onClick={sameCrew} className="h-10">
            Same crew as last time
          </Button>
        )}
      </div>

      <div className="mt-2 max-h-[38vh] overflow-y-auto rounded-xl">
        {shown.map((p) => {
          const on = picked.has(p.name);
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => toggle(p.name)}
              aria-pressed={on}
              className={`tap w-full h-12 px-2 flex items-center gap-3 border-t border-line first:border-t-0 text-left ${on ? 'bg-surface-raised' : ''}`}
            >
              <Avatar name={p.name} pictureUrl={p.pictureUrl} size={32} />
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-semibold text-ink truncate">{p.name}</span>
                {p.injured && <span className="text-[10px] font-bold tracking-[0.08em] text-danger">INJURED</span>}
              </span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ${on ? 'bg-accent text-accent-ink' : 'border border-line-strong'}`}>
                {on && <Icon name="check" size={14} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
        {shown.length === 0 && <p className="text-sm text-ink-2 py-4 text-center">No one matches. Add players from the Players tab first.</p>}
      </div>

      {/* Outsiders who are here tonight. Name them later from the court if you catch a name. */}
      <div className="mt-4 flex items-center justify-between gap-3 h-14 px-4 rounded-xl bg-court border border-line">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-ink">Guests</div>
          <div className="text-xs text-ink-2 truncate">Not in the group. No names needed.</div>
        </div>
        <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Guests">
          <button
            type="button"
            onClick={() => setGuestCount((n) => Math.max(0, n - 1))}
            disabled={guestCount === 0}
            aria-label="One fewer guest"
            className="tap w-11 h-11 rounded-full bg-surface text-ink flex items-center justify-center disabled:opacity-40"
          >
            <Icon name="minus" size={18} />
          </button>
          <span className="display w-8 text-center text-2xl text-ink tabular">{guestCount}</span>
          <button
            type="button"
            onClick={() => setGuestCount((n) => n + 1)}
            aria-label="One more guest"
            className="tap w-11 h-11 rounded-full bg-surface text-ink flex items-center justify-center"
          >
            <Icon name="plus" size={18} />
          </button>
        </div>
      </div>

      <Button variant="primary" size="lg" className="w-full mt-4 font-display text-xl tracking-[0.04em]" disabled={headcount < MIN_PLAYERS || starting} onClick={start}>
        {starting ? 'STARTING…' : 'START SESSION'}
      </Button>
    </Sheet>
  );
};

export default StartLiveSessionSheet;
