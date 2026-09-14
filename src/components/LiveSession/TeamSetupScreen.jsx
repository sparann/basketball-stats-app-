import { useMemo, useState } from 'react';
import { useLiveSession } from './LiveSessionContext';
import { useUI } from '../../context/ui-context';
import { shortName } from '../../utils/names';
import { TEAM_CAP, TEAM_LABELS } from '../../utils/liveStats';
import Button from '../ui/Button';
import { PlayerChip } from './TeamBits';

/**
 * Two steps: pick Light, then pick Dark from who is left. Everyone else is the
 * bench. Teams are capped at TEAM_CAP and must match.
 */
const TeamSetupScreen = ({ onDone, onCancel }) => {
  const { allPlayers, gameNumber, actions } = useLiveSession();
  const { toast } = useUI();
  const [step, setStep] = useState('team_a');
  const [picks, setPicks] = useState({ team_a: new Set(), team_b: new Set() });

  const names = useMemo(() => allPlayers.map((p) => p.name), [allPlayers]);
  const pool = step === 'team_a' ? allPlayers : allPlayers.filter((p) => !picks.team_a.has(p.name));
  const current = picks[step];
  const limit = step === 'team_a' ? TEAM_CAP : picks.team_a.size;
  const ready = step === 'team_a' ? current.size > 0 : current.size === picks.team_a.size;

  const toggle = (name) => {
    setPicks((prev) => {
      const next = new Set(prev[step]);
      if (next.has(name)) next.delete(name);
      else if (next.size < limit) next.add(name);
      return { ...prev, [step]: next };
    });
    navigator.vibrate?.(10);
  };

  const finish = () => {
    const problem = actions.updateLineup({
      teamA: [...picks.team_a],
      teamB: [...picks.team_b],
      bench: names.filter((n) => !picks.team_a.has(n) && !picks.team_b.has(n))
    });
    if (problem) {
      toast(problem, { type: 'error' });
      return;
    }
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 bg-court flex flex-col">
      <header className="shrink-0 px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-3 flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow mb-1.5 tabular">Game {gameNumber}</div>
          <h1 className="display text-4xl leading-none text-ink font-extrabold">Pick {TEAM_LABELS[step]}</h1>
          <p className="text-[13px] text-ink-2 mt-2 tabular">
            {step === 'team_a'
              ? `${current.size} of up to ${TEAM_CAP} · tap to select`
              : `${current.size} of ${picks.team_a.size} · match Light's size`}
          </p>
        </div>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          {pool.map((p) => {
            const selected = current.has(p.name);
            return (
              <PlayerChip
                key={p.name}
                label={shortName(p.name, names)}
                record={`${p.gamesWon}–${p.gamesPlayed - p.gamesWon}`}
                selected={false}
                tone={selected ? (step === 'team_a' ? 'light' : 'dark') : 'surface'}
                disabled={!selected && current.size >= limit}
                onClick={() => toggle(p.name)}
              />
            );
          })}
        </div>
        {pool.length === 0 && <p className="text-sm text-ink-2 px-1">Nobody left to pick. Go back and take fewer for Light.</p>}
      </main>

      <footer className="shrink-0 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] flex gap-3">
        {step === 'team_b' && (
          <Button variant="secondary" size="lg" onClick={() => setStep('team_a')}>
            Back
          </Button>
        )}
        {step === 'team_a' ? (
          <Button variant="primary" size="lg" className="flex-1 font-display text-xl tracking-[0.04em]" disabled={!ready} onClick={() => setStep('team_b')}>
            NEXT · PICK DARK
          </Button>
        ) : (
          <Button variant="primary" size="lg" className="flex-1 font-display text-xl tracking-[0.04em]" disabled={!ready} onClick={finish}>
            START GAME {gameNumber}
          </Button>
        )}
      </footer>
    </div>
  );
};

export default TeamSetupScreen;
