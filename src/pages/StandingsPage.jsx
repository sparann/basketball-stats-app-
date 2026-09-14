import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/data-context';
import {
  aggregatePlayerStats,
  computeStandings,
  formatWinPercentage,
  parseLocalDate
} from '../utils/calculations';
import { shortName } from '../utils/names';
import PageHeader from '../components/ui/PageHeader';
import Avatar from '../components/ui/Avatar';
import Sparkline from '../components/ui/Sparkline';
import Sheet from '../components/ui/Sheet';
import Icon from '../components/ui/Icon';

const PERIODS = [
  ['week', 'This week'],
  ['month', 'This month'],
  ['year', 'This year'],
  ['allTime', 'All time']
];

const SORTS = [
  ['winPercentage', 'Win %'],
  ['totalGames', 'Games played']
];

const filterSessionsByPeriod = (sessions, period) => {
  if (period === 'allTime') return sessions;
  const since = new Date();
  if (period === 'week') since.setDate(since.getDate() - 7);
  if (period === 'month') since.setMonth(since.getMonth() - 1);
  if (period === 'year') since.setFullYear(since.getFullYear() - 1);
  return sessions.filter((s) => parseLocalDate(s.date) >= since);
};

const StandingRow = ({ player, rank, allNames }) => {
  const losses = player.totalGamesPlayed - player.totalGamesWon;
  const topThree = rank !== null && rank <= 3;

  return (
    <Link
      to={`/players/${encodeURIComponent(player.name)}`}
      className="flex items-center gap-3 h-[60px] px-5 border-t border-line active:bg-surface-raised"
    >
      <div className={`display w-[26px] text-[22px] leading-none ${topThree ? 'text-accent' : 'text-ink-3'}`}>
        {rank ?? '·'}
      </div>
      <Avatar name={player.name} pictureUrl={player.pictureUrl} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[16px] font-semibold leading-tight text-ink truncate">
            {shortName(player.name, allNames)}
          </span>
          {player.injured && (
            <span className="text-[10px] font-bold tracking-[0.08em] text-danger">INJ</span>
          )}
        </div>
        <div className="tabular text-xs text-ink-2 leading-tight mt-0.5">
          {player.totalGamesWon}–{losses} · {player.sessionsAttended} {player.sessionsAttended === 1 ? 'session' : 'sessions'}
        </div>
      </div>
      <div className="flex flex-col items-end gap-[5px]">
        <div className="display text-2xl leading-none text-ink">
          {formatWinPercentage(player.overallWinPercentage, player.totalGamesPlayed)}
        </div>
        <Sparkline values={player.sessions.map((s) => s.winPercentage)} />
      </div>
    </Link>
  );
};

const GroupToggle = ({ label, count, open, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="w-full flex items-center justify-between h-11 px-5 border-t border-line text-left"
    aria-expanded={open}
  >
    <span className="flex items-center gap-2">
      <span className="eyebrow">{label}</span>
      <span className="text-[11px] font-semibold text-ink-3">{count}</span>
    </span>
    <Icon name={open ? 'chevronUp' : 'chevronDown'} size={16} className="text-ink-3" />
  </button>
);

const OptionList = ({ options, value, onChange }) => (
  <div className="rounded-xl overflow-hidden border border-line">
    {options.map(([key, label]) => (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        className={`w-full flex items-center justify-between h-12 px-4 text-[15px] font-medium border-t border-line first:border-t-0 ${
          value === key ? 'bg-surface-raised text-ink' : 'text-ink-2'
        }`}
      >
        {label}
        {value === key && <Icon name="check" size={18} className="text-accent" />}
      </button>
    ))}
  </div>
);

const StandingsPage = () => {
  const { players, sessions } = useData();
  const [period, setPeriod] = useState('allTime');
  const [sortBy, setSortBy] = useState('winPercentage');
  const [filterOpen, setFilterOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({ needsMoreGames: false, inactive: false });

  const scopedPlayers = useMemo(() => {
    if (period === 'allTime') return players;
    const filtered = filterSessionsByPeriod(sessions, period);
    return aggregatePlayerStats(filtered).map((p) => {
      const base = players.find((x) => x.name === p.name);
      return {
        ...p,
        injured: base?.injured || false,
        pictureUrl: base?.pictureUrl || '',
        height: base?.height || '',
        weight: base?.weight || ''
      };
    });
  }, [players, sessions, period]);

  const standings = useMemo(() => computeStandings(scopedPlayers, sortBy), [scopedPlayers, sortBy]);
  const allNames = useMemo(() => scopedPlayers.map((p) => p.name), [scopedPlayers]);

  const periodLabel = PERIODS.find(([key]) => key === period)[1];
  const toggleGroup = (key) => setOpenGroups((g) => ({ ...g, [key]: !g[key] }));

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Standings"
        action={
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="h-10 px-3.5 rounded-full bg-surface border border-line text-sm font-medium text-ink flex items-center gap-1.5"
          >
            {periodLabel}
            <Icon name="chevronDown" size={14} className="text-ink-2" />
          </button>
        }
      />

      {/* Active standings */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <button
          type="button"
          onClick={() => setRulesOpen(true)}
          className="flex items-center gap-1.5"
          aria-label="How rankings work"
        >
          <span className="eyebrow">Active</span>
          <Icon name="info" size={14} className="text-ink-3" />
        </button>
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3 tabular">
          Min {standings.minimumGames} games · 2 sessions
        </span>
      </div>

      {standings.active.length === 0 ? (
        <p className="px-5 py-8 text-sm text-ink-2 border-t border-line">
          {players.length === 0
            ? 'No games recorded yet.'
            : 'Nobody qualifies for the standings yet. Everyone is listed below.'}
        </p>
      ) : (
        standings.active.map((player) => (
          <StandingRow key={player.name} player={player} rank={player.rank} allNames={allNames} />
        ))
      )}

      {/* Collapsed groups */}
      {standings.needsMoreGames.length > 0 && (
        <>
          <GroupToggle
            label="Needs more games"
            count={standings.needsMoreGames.length}
            open={openGroups.needsMoreGames}
            onToggle={() => toggleGroup('needsMoreGames')}
          />
          {openGroups.needsMoreGames &&
            standings.needsMoreGames.map((player) => (
              <StandingRow key={player.name} player={player} rank={null} allNames={allNames} />
            ))}
        </>
      )}

      {standings.inactive.length > 0 && (
        <>
          <GroupToggle
            label="Inactive"
            count={standings.inactive.length}
            open={openGroups.inactive}
            onToggle={() => toggleGroup('inactive')}
          />
          {openGroups.inactive &&
            standings.inactive.map((player) => (
              <StandingRow key={player.name} player={player} rank={null} allNames={allNames} />
            ))}
        </>
      )}

      <div className="border-t border-line" />

      <footer className="px-5 pt-10 pb-4 text-center text-xs text-ink-3">
        Powered by Wyatt's midrange jumpshot
        <span className="text-court select-text"> · Admin password: treysucks</span>
      </footer>

      {/* Filter sheet */}
      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Show">
        <div className="space-y-5">
          <div>
            <div className="eyebrow mb-2">Period</div>
            <OptionList options={PERIODS} value={period} onChange={(v) => { setPeriod(v); setFilterOpen(false); }} />
          </div>
          <div>
            <div className="eyebrow mb-2">Sort by</div>
            <OptionList options={SORTS} value={sortBy} onChange={(v) => { setSortBy(v); setFilterOpen(false); }} />
          </div>
        </div>
      </Sheet>

      {/* Rules sheet */}
      <Sheet open={rulesOpen} onClose={() => setRulesOpen(false)} title="How rankings work">
        <div className="space-y-4 text-[15px] leading-relaxed text-ink-2">
          <p>
            <span className="text-ink font-semibold">Active</span> standings need{' '}
            <span className="text-ink font-semibold tabular">{standings.minimumGames}+ games</span>,{' '}
            <span className="text-ink font-semibold">2+ sessions</span>, and a game in the last 14 days.
            Rankings are by real win percentage.
          </p>
          <p>
            The games minimum moves with the group: it is 40% of the average games played,
            never below 5 or above 20.
          </p>
          <p>
            <span className="text-ink font-semibold">Needs more games</span> is anyone active who
            has not hit both minimums yet. <span className="text-ink font-semibold">Inactive</span> is
            anyone who has not played in 14 days.
          </p>
        </div>
      </Sheet>
    </div>
  );
};

export default StandingsPage;
