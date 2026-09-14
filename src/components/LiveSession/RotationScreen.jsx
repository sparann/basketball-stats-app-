import { useMemo, useState } from 'react';
import { useLiveSession } from './LiveSessionContext';
import { useUI } from '../../context/ui-context';
import { shortName } from '../../utils/names';
import { TEAM_LABELS, lineupKey, matchupStatus, otherTeam } from '../../utils/liveStats';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { PlayerChip, TeamPill } from './TeamBits';

const Group = ({ title, count, active, onMoveHere, full = false, children }) => (
  <section className={`bg-surface rounded-2xl p-3 ${full ? 'col-span-2' : ''}`}>
    <button
      type="button"
      onClick={onMoveHere}
      disabled={!active}
      className={`w-full flex items-center justify-between pb-2 border-b text-left ${active ? 'border-accent' : 'border-line'}`}
    >
      {title}
      <span className={`text-xs font-semibold tabular ${active ? 'text-accent' : 'text-ink-2'}`}>
        {active ? 'Move here' : count}
      </span>
    </button>
    <div className="pt-2 flex flex-col gap-1.5">{children}</div>
  </section>
);

/**
 * Between games. Tap players to select them, then tap the group they go to.
 * Starts from the teams that just played so the common case is a few taps.
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
  const [selected, setSelected] = useState(() => new Set());

  const toggle = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    navigator.vibrate?.(10);
  };

  const moveTo = (key) => {
    if (selected.size === 0) return;
    setGroups((g) => {
      const strip = (list) => list.filter((n) => !selected.has(n));
      const moving = names.filter((n) => selected.has(n));
      return { teamA: strip(g.teamA), teamB: strip(g.teamB), bench: strip(g.bench), [key]: [...strip(g[key]), ...moving] };
    });
    setSelected(new Set());
    navigator.vibrate?.(20);
  };

  const bringInBench = () => {
    setGroups((g) => ({ ...g, [loserKey]: [...g[loserKey], ...g.bench], bench: [] }));
    navigator.vibrate?.(20);
  };

  const status = matchupStatus(groups.teamA, groups.teamB);
  const hasSelection = selected.size > 0;

  const start = () => {
    const problem = actions.updateLineup(groups);
    if (problem) {
      toast(problem, { type: 'error' });
      return;
    }
    onDone();
  };

  const rows = (list) =>
    list.map((name) => {
      const p = statsByName.get(name) || { gamesPlayed: 0, gamesWon: 0 };
      return (
        <PlayerChip
          key={name}
          label={shortName(name, names)}
          record={`${p.gamesWon}–${p.gamesPlayed - p.gamesWon}`}
          selected={selected.has(name)}
          onClick={() => toggle(name)}
        />
      );
    });

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
          {groups.bench.length > 0 ? `${TEAM_LABELS[loser]} shoots for spots. ` : ''}
          Tap players, then tap where they go.
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-3">
        <div className="grid grid-cols-2 gap-3">
          <Group title={<TeamPill team="team_a" />} count={groups.teamA.length} active={hasSelection} onMoveHere={() => moveTo('teamA')}>
            {rows(groups.teamA)}
          </Group>
          <Group title={<TeamPill team="team_b" />} count={groups.teamB.length} active={hasSelection} onMoveHere={() => moveTo('teamB')}>
            {rows(groups.teamB)}
          </Group>
          <Group title={<span className="eyebrow">Bench</span>} count={groups.bench.length} active={hasSelection} onMoveHere={() => moveTo('bench')} full>
            {groups.bench.length === 0 ? (
              <p className="text-sm text-ink-3 py-1">Nobody on the bench</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {groups.bench.map((name) => {
                  const p = statsByName.get(name) || { gamesPlayed: 0, gamesWon: 0 };
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggle(name)}
                      aria-pressed={selected.has(name)}
                      className={`tap h-11 px-3.5 rounded-[10px] flex items-center gap-2 text-[15px] font-semibold ${
                        selected.has(name) ? 'bg-surface-raised text-ink border-[1.5px] border-accent' : 'bg-court text-ink'
                      }`}
                    >
                      {shortName(name, names)}
                      <span className="text-xs font-medium text-ink-2 tabular">{p.gamesWon}–{p.gamesPlayed - p.gamesWon}</span>
                      {selected.has(name) && <Icon name="check" size={16} strokeWidth={2.5} className="text-accent" />}
                    </button>
                  );
                })}
              </div>
            )}
          </Group>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 min-h-[36px]">
          {hasSelection ? (
            <>
              <span className="h-[22px] px-2 rounded-full bg-accent text-accent-ink text-xs font-bold tabular flex items-center">{selected.size}</span>
              <span className="text-[13px] text-ink-2">selected · tap Light, Dark or Bench to move</span>
            </>
          ) : groups.bench.length > 0 ? (
            <Button variant="secondary" onClick={bringInBench}>
              <Icon name="shuffle" size={16} /> Bring the bench in for {TEAM_LABELS[loser]}
            </Button>
          ) : null}
        </div>
      </main>

      <footer className="shrink-0 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <p className={`text-center text-[13px] font-semibold tabular mb-2.5 ${status.ready ? 'text-ink-2' : 'text-accent'}`}>{status.text}</p>
        <Button variant="primary" size="lg" className="w-full font-display text-xl tracking-[0.04em]" disabled={!status.ready} onClick={start}>
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
