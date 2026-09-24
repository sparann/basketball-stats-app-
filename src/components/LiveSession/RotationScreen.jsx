import { useMemo, useState } from 'react';
import { useLiveSession } from './LiveSessionContext';
import { useUI } from '../../context/ui-context';
import { shortName } from '../../utils/names';
import { TEAM_LABELS, lineupKey, matchupStatus, otherTeam } from '../../utils/liveStats';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { TeamPill } from './TeamBits';

const without = (list, name) => list.filter((n) => n !== name);

/** One team during rotation. Tap a row to sit that player; the arrow flips them to the other team. */
const TeamColumn = ({ team, list, otherCount, names, record, onSit, onFlip }) => {
  const other = otherTeam(team);
  const short = list.length < otherCount;
  return (
    <section className="bg-surface rounded-2xl p-3 min-h-[120px]">
      <div className="flex items-center justify-between pb-2 border-b border-line">
        <TeamPill team={team} />
        <span className={`text-xs font-semibold tabular ${short ? 'text-accent' : 'text-ink-2'}`}>
          {short ? `needs ${otherCount - list.length}` : list.length}
        </span>
      </div>
      <div className="pt-2 flex flex-col gap-1.5">
        {list.length === 0 && <p className="text-sm text-ink-3 py-2 text-center">Empty</p>}
        {list.map((name) => (
          <div key={name} className="flex items-stretch gap-1">
            <button
              type="button"
              onClick={() => onSit(name)}
              aria-label={`Sit ${name}`}
              className="tap flex-1 min-w-0 h-11 px-3 rounded-[10px] bg-court flex items-center justify-between gap-2 text-left active:bg-surface-raised"
            >
              <span className="text-[15px] font-semibold text-ink truncate">{shortName(name, names)}</span>
              <span className="text-xs font-medium text-ink-2 tabular shrink-0">{record(name)}</span>
            </button>
            <button
              type="button"
              onClick={() => onFlip(name)}
              aria-label={`Move ${name} to ${TEAM_LABELS[other]}`}
              className="tap w-9 h-11 rounded-[10px] bg-court text-ink-3 flex items-center justify-center active:bg-surface-raised"
            >
              <Icon name={team === 'team_a' ? 'chevronRight' : 'chevronLeft'} size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

/**
 * Between games. Every move is one tap and the direction is obvious:
 * tap a player on a team to sit them, tap a bench player to bring them in
 * (to the team that needs someone), tap the arrow on a row to flip them to
 * the other team. Undo takes back the last move.
 */
const RotationScreen = ({ result, onDone, onReshoot, onEnd, onCancel }) => {
  const { lineup, allPlayers, gameNumber, actions } = useLiveSession();
  const { toast } = useUI();

  const loser = otherTeam(result.winner);
  const loserKey = lineupKey(loser);
  const names = useMemo(() => allPlayers.map((p) => p.name), [allPlayers]);
  const statsByName = useMemo(() => new Map(allPlayers.map((p) => [p.name, p])), [allPlayers]);

  const [groups, setGroups] = useState(() => ({
    teamA: [...lineup.teamA],
    teamB: [...lineup.teamB],
    bench: [...lineup.bench]
  }));
  const [history, setHistory] = useState([]);

  const apply = (next) => {
    setHistory((h) => [...h, groups]);
    setGroups(next);
    navigator.vibrate?.(15);
  };

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((h) => h.slice(0, -1));
    setGroups(previous);
  };

  const sit = (name) =>
    apply({ teamA: without(groups.teamA, name), teamB: without(groups.teamB, name), bench: [...groups.bench, name] });

  /** Bench players go to the short-handed team, or the losing team when even. */
  const bringIn = (name) => {
    const target =
      groups.teamA.length < groups.teamB.length ? 'teamA' : groups.teamB.length < groups.teamA.length ? 'teamB' : loserKey;
    apply({ ...groups, bench: without(groups.bench, name), [target]: [...groups[target], name] });
  };

  const flip = (name) => {
    const from = groups.teamA.includes(name) ? 'teamA' : 'teamB';
    const to = from === 'teamA' ? 'teamB' : 'teamA';
    apply({ ...groups, [from]: without(groups[from], name), [to]: [...groups[to], name] });
  };

  const bringInBench = () => apply({ ...groups, [loserKey]: [...groups[loserKey], ...groups.bench], bench: [] });

  const status = matchupStatus(groups.teamA, groups.teamB);

  const start = () => {
    const problem = actions.updateLineup(groups);
    if (problem) {
      toast(problem, { type: 'error' });
      return;
    }
    onDone();
  };

  const record = (name) => {
    const p = statsByName.get(name) || { gamesPlayed: 0, gamesWon: 0 };
    return `${p.gamesWon}–${p.gamesPlayed - p.gamesWon}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-court flex flex-col">
      <header className="shrink-0 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-2">
        <div className="flex items-center justify-between">
          <span className="eyebrow tabular">Game {result.gameNumber} · Final</span>
          <button type="button" onClick={onCancel} className="tap px-2 -mr-2 text-[13px] font-medium text-ink-2">
            Cancel
          </button>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <TeamPill team={result.winner} size="lg" />
          <span className="display text-4xl leading-none text-ink font-extrabold">wins</span>
        </div>
        <p className="text-[13px] text-ink-2 mt-2">
          Tap a player to sit them. Tap someone on the bench to bring them in. Arrows switch teams.
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-3">
        <div className="grid grid-cols-2 gap-3">
          <TeamColumn
            team="team_a"
            list={groups.teamA}
            otherCount={groups.teamB.length}
            names={names}
            record={record}
            onSit={sit}
            onFlip={flip}
          />
          <TeamColumn
            team="team_b"
            list={groups.teamB}
            otherCount={groups.teamA.length}
            names={names}
            record={record}
            onSit={sit}
            onFlip={flip}
          />
        </div>

        <section className="mt-3 bg-surface rounded-2xl p-3">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <span className="eyebrow">Bench</span>
            <span className="text-xs font-semibold text-ink-2 tabular">{groups.bench.length}</span>
          </div>
          {groups.bench.length === 0 ? (
            <p className="text-sm text-ink-3 py-3 text-center">Nobody on the bench</p>
          ) : (
            <div className="pt-2 flex flex-wrap gap-1.5">
              {groups.bench.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => bringIn(name)}
                  aria-label={`Bring in ${name}`}
                  className="tap h-11 pl-3.5 pr-2.5 rounded-[10px] bg-court flex items-center gap-2 text-[15px] font-semibold text-ink active:bg-surface-raised"
                >
                  {shortName(name, names)}
                  <span className="text-xs font-medium text-ink-2 tabular">{record(name)}</span>
                  <Icon name="chevronUp" size={16} className="text-ink-3" />
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="mt-3 flex items-center justify-center gap-2 min-h-[44px]">
          {groups.bench.length > 0 && (
            <Button variant="secondary" onClick={bringInBench}>
              <Icon name="shuffle" size={16} /> Bring the bench in for {TEAM_LABELS[loser]}
            </Button>
          )}
          <Button variant="ghost" onClick={undo} disabled={history.length === 0}>
            <Icon name="undo" size={16} /> Undo
          </Button>
        </div>
      </main>

      <footer className="shrink-0 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <p className={`text-center text-[13px] font-semibold tabular mb-2.5 ${status.ready ? 'text-ink-2' : 'text-accent'}`}>
          {status.text}
        </p>
        <Button
          variant="primary"
          size="lg"
          className="w-full font-display text-xl tracking-[0.04em]"
          disabled={!status.ready}
          onClick={start}
        >
          START GAME {gameNumber}
        </Button>
        <div className="grid grid-cols-2 mt-1">
          <Button variant="ghost" onClick={onReshoot}>Reshoot teams</Button>
          <Button variant="ghost" onClick={onEnd}>End session</Button>
        </div>
      </footer>
    </div>
  );
};

export default RotationScreen;
