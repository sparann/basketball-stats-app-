import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useData } from '../context/data-context';
import {
  calculateWinPercentage,
  formatDate,
  formatWinPercentage,
  getSessionTotalGames,
  getSessionTopPerformers
} from '../utils/calculations';
import Avatar from '../components/ui/Avatar';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import { isGuest } from '../utils/guests';

const Tile = ({ label, value }) => (
  <div className="bg-surface rounded-xl px-3 py-2.5">
    <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">{label}</div>
    <div className="display text-[26px] leading-none mt-1.5 text-ink">{value}</div>
  </div>
);

const SessionPage = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const { sessions, players } = useData();

  const decoded = decodeURIComponent(key);
  const session = sessions.find((s) => String(s.id) === decoded || s.date === decoded);

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-5 pt-[calc(env(safe-area-inset-top)+16px)]">
        <Button variant="ghost" onClick={() => navigate('/sessions')}>
          <Icon name="chevronLeft" /> Sessions
        </Button>
        <p className="mt-8 text-ink-2">That session isn't here anymore.</p>
      </div>
    );
  }

  const totalGames = getSessionTotalGames(session);
  const mvpNames = new Set(getSessionTopPerformers(session).map((p) => p.name));
  const ranked = session.players
    .map((p) => ({ ...p, winPercentage: calculateWinPercentage(p.gamesWon, p.gamesPlayed) }))
    .sort((a, b) => b.winPercentage - a.winPercentage || b.gamesWon - a.gamesWon);
  const avgGames = (session.players.reduce((sum, p) => sum + p.gamesPlayed, 0) / session.players.length).toFixed(1);
  const avgWinRate = ranked.reduce((sum, p) => sum + p.winPercentage, 0) / ranked.length;

  let rank = 0;
  let lastPct = null;
  const withRanks = ranked.map((p) => {
    if (p.winPercentage !== lastPct) rank++;
    lastPct = p.winPercentage;
    return { ...p, rank };
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="tap w-11 h-11 rounded-full bg-surface flex items-center justify-center text-ink"
        >
          <Icon name="chevronLeft" />
        </button>
      </div>

      <div className="px-5 pt-4">
        <div className="eyebrow mb-2">Session</div>
        <h1 className="display text-[40px] leading-none text-ink font-extrabold">{formatDate(session.date)}</h1>
        {session.location && (
          <div className="flex items-center gap-1.5 text-[13px] text-ink-2 mt-2">
            <Icon name="pin" size={14} /> {session.location}
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 px-5 pt-5">
        <Tile label="Games" value={totalGames} />
        <Tile label="Players" value={session.players.length} />
        <Tile label="Avg games" value={avgGames} />
        <Tile label="Avg win" value={formatWinPercentage(avgWinRate, 1)} />
      </div>

      <div className="px-5 pt-6 pb-2 flex items-center justify-between">
        <span className="eyebrow">Results</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">MVP needs half the games</span>
      </div>

      {withRanks.map((p) => {
        const full = players.find((x) => x.name === p.name);
        const isMvp = mvpNames.has(p.name);
        const guest = isGuest(p);
        const Row = guest ? 'div' : Link;
        const rowProps = guest ? {} : { to: `/players/${encodeURIComponent(p.name)}` };
        return (
          <Row
            key={p.name}
            {...rowProps}
            className={`flex items-center gap-3 h-[60px] px-5 border-t border-line ${guest ? '' : 'active:bg-surface-raised'}`}
          >
            <div className={`display w-[26px] text-[22px] leading-none ${isMvp ? 'text-accent' : 'text-ink-3'}`}>{p.rank}</div>
            <Avatar name={p.name} pictureUrl={full?.pictureUrl} size={36} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[16px] font-semibold truncate ${guest ? 'text-ink-2 italic' : 'text-ink'}`}>{p.name}</span>
                {isMvp && <span className="text-[10px] font-bold tracking-[0.08em] text-accent">MVP</span>}
                {guest && <span className="text-[10px] font-bold tracking-[0.08em] text-ink-3">GUEST</span>}
              </div>
              <div className="text-xs text-ink-2 tabular mt-0.5">
                {p.gamesWon}–{p.gamesPlayed - p.gamesWon} · {p.gamesPlayed} games
                {p.notes && <span className="italic"> · {p.notes}</span>}
              </div>
            </div>
            <div className="display text-2xl text-ink">{formatWinPercentage(p.winPercentage, p.gamesPlayed)}</div>
          </Row>
        );
      })}

      <div className="border-t border-line" />
    </div>
  );
};

export default SessionPage;
