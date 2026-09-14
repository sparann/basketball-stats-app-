import { useMemo, useState } from 'react';
import { useLiveSession } from './LiveSessionContext';
import { useUI } from '../../context/ui-context';
import { formatDate } from '../../utils/calculations';
import { shortName } from '../../utils/names';
import { sessionStandings } from '../../utils/liveStats';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';

const Tile = ({ label, value }) => (
  <div className="bg-court rounded-xl px-3 py-2.5">
    <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">{label}</div>
    <div className="display text-[26px] leading-none mt-1.5 text-ink">{value}</div>
  </div>
);

const durationLabel = (startedAt) => {
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return '—';
  const mins = Math.max(0, Math.floor((Date.now() - start.getTime()) / 60000));
  const h = Math.floor(mins / 60);
  return h > 0 ? `${h}h ${mins % 60}m` : `${mins}m`;
};

/** Review the night, then save it to the standings. */
const EndSessionSheet = ({ open, onClose, onEnded }) => {
  const { session, games, allPlayers, actions } = useLiveSession();
  const { toast } = useUI();
  const [saving, setSaving] = useState(false);

  const standings = useMemo(() => sessionStandings(allPlayers), [allPlayers]);
  const names = allPlayers.map((p) => p.name);
  const mvp = standings.find((p) => p.gamesPlayed > 0 && p.gamesPlayed >= games.length / 2) || null;

  const save = async () => {
    setSaving(true);
    try {
      await actions.endSession();
      toast('Session saved to the standings');
      onEnded();
    } catch (error) {
      toast(error.message || "Couldn't save the session. Your games are still here.", { type: 'error', duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  if (!session) return null;

  return (
    <Sheet open={open} onClose={saving ? undefined : onClose} title="End session" size="lg">
      <p className="text-[13px] text-ink-2 -mt-1 mb-4">
        {formatDate(session.date)}
        {session.location ? ` · ${session.location}` : ''}
      </p>

      <div className="grid grid-cols-3 gap-2">
        <Tile label="Games" value={games.length} />
        <Tile label="Players" value={allPlayers.length} />
        <Tile label="Duration" value={durationLabel(session.started_at || session.created_at)} />
      </div>

      {mvp && (
        <div className="mt-3 bg-accent text-accent-ink rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-80">Top performer</div>
            <div className="display text-2xl leading-none mt-1">{mvp.name}</div>
          </div>
          <div className="text-right tabular">
            <div className="display text-2xl leading-none">{Math.round((mvp.gamesWon / mvp.gamesPlayed) * 100)}%</div>
            <div className="text-xs font-semibold opacity-80 mt-1">{mvp.gamesWon}–{mvp.gamesPlayed - mvp.gamesWon}</div>
          </div>
        </div>
      )}

      <div className="mt-4 max-h-[36vh] overflow-y-auto rounded-xl bg-court">
        {standings.map((p, i) => (
          <div key={p.name} className="flex items-center gap-3 h-12 px-3 border-t border-line first:border-t-0">
            <span className={`display w-6 text-lg ${i < 3 && p.gamesPlayed > 0 ? 'text-accent' : 'text-ink-3'}`}>{i + 1}</span>
            <span className="flex-1 text-[15px] font-semibold text-ink truncate">{shortName(p.name, names)}</span>
            <span className="text-xs text-ink-2 tabular">{p.gamesWon}–{p.gamesPlayed - p.gamesWon}</span>
            <span className="display w-12 text-right text-lg text-ink tabular">
              {p.gamesPlayed ? `${Math.round((p.gamesWon / p.gamesPlayed) * 100)}%` : '—'}
            </span>
          </div>
        ))}
      </div>

      {games.length === 0 && (
        <p className="mt-3 text-[13px] text-accent">No games recorded yet. Ending now saves an empty night.</p>
      )}

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Button variant="secondary" size="lg" onClick={onClose} disabled={saving}>
          Keep playing
        </Button>
        <Button variant="primary" size="lg" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save & end'}
        </Button>
      </div>
    </Sheet>
  );
};

export default EndSessionSheet;
