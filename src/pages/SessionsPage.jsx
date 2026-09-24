import { Link } from 'react-router-dom';
import { useData } from '../context/data-context';
import { formatDate, formatWinPercentage, getSessionTotalGames, getSessionTopPerformers } from '../utils/calculations';
import { shortName } from '../utils/names';
import PageHeader from '../components/ui/PageHeader';
import Icon from '../components/ui/Icon';
import LiveBadge from '../components/ui/LiveBadge';

const sessionKey = (session) => String(session.id || session.date);

const SessionsPage = () => {
  const { sessions, players } = useData();
  const sorted = [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1));
  const allNames = players.map((p) => p.name);

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Sessions" badge={<LiveBadge />} />

      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <span className="eyebrow">History</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3 tabular">
          {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
        </span>
      </div>

      {sorted.length === 0 && (
        <p className="px-5 py-8 text-sm text-ink-2 border-t border-line">No sessions recorded yet.</p>
      )}

      {sorted.map((session) => {
        const totalGames = getSessionTotalGames(session);
        const mvps = getSessionTopPerformers(session);
        return (
          <Link
            key={sessionKey(session)}
            to={`/sessions/${encodeURIComponent(sessionKey(session))}`}
            className="flex items-center gap-3 px-5 py-3.5 border-t border-line active:bg-surface-raised"
          >
            <div className="flex-1 min-w-0">
              <div className="display text-[20px] leading-none text-ink">{formatDate(session.date)}</div>
              <div className="text-xs text-ink-2 mt-1.5 truncate tabular">
                {session.players.length} players · {totalGames} games
                {session.location && ` · ${session.location}`}
              </div>
            </div>
            {mvps.length > 0 && (
              <div className="text-right">
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                  {mvps.length > 1 ? 'MVPs' : 'MVP'}
                </div>
                <div className="text-sm font-semibold text-ink truncate max-w-[140px]">
                  {mvps.map((p) => shortName(p.name, allNames)).join(', ')}
                </div>
                <div className="display text-base text-accent leading-none mt-0.5">
                  {formatWinPercentage(mvps[0].winPercentage, mvps[0].gamesPlayed)}
                </div>
              </div>
            )}
            <Icon name="chevronRight" size={18} className="text-ink-3 shrink-0" />
          </Link>
        );
      })}

      <div className="border-t border-line" />
    </div>
  );
};

export default SessionsPage;
