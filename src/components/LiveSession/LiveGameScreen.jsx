import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveSession } from './LiveSessionContext';
import { useUI } from '../../context/ui-context';
import { isLocalLiveStore } from '../../lib/liveSessionStore';
import { formatDate } from '../../utils/calculations';
import { shortName } from '../../utils/names';
import { TEAMS, TEAM_LABELS, teamRecord, winStreak } from '../../utils/liveStats';
import { isGuest, nextGuestName } from '../../utils/guests';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import Sheet from '../ui/Sheet';
import { TeamPill, WinnerButton } from './TeamBits';
import TeamSetupScreen from './TeamSetupScreen';
import RotationScreen from './RotationScreen';
import EndSessionSheet from './EndSessionSheet';
import AddPlayerSheet from './AddPlayerSheet';
import SessionStandingsSheet from './SessionStandingsSheet';
import GuestSheet from './GuestSheet';

const IconButton = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="tap w-11 h-11 rounded-full bg-surface text-ink flex items-center justify-center"
  >
    <Icon name={icon} size={18} />
  </button>
);

const TeamCard = ({ team, players, record, allNames, onGuestTap }) => (
  <section className="bg-surface rounded-2xl px-3 pt-2.5 pb-1.5">
    <div className="flex items-center justify-between pb-1.5 border-b border-line">
      <TeamPill team={team} />
      <span className="display text-lg text-ink">{record.wins}–{record.losses}</span>
    </div>
    <ul>
      {players.map((p) => {
        const guest = isGuest(p.name);
        const inner = (
          <>
            <span className={`text-[15px] font-semibold truncate ${guest ? 'text-ink-2 italic' : 'text-ink'}`}>
              {shortName(p.name, allNames)}
            </span>
            <span className="text-xs text-ink-2 tabular shrink-0">{p.gamesWon}–{p.gamesPlayed - p.gamesWon}</span>
          </>
        );
        return (
          <li key={p.name} className="h-[38px]">
            {guest ? (
              <button type="button" onClick={() => onGuestTap(p.name)} className="w-full h-full flex items-center justify-between gap-2 text-left">
                {inner}
              </button>
            ) : (
              <div className="h-full flex items-center justify-between gap-2">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  </section>
);

/** Keep the screen on courtside. Browsers drop the lock when the tab hides, so re-request on return. */
const useWakeLock = () => {
  const lockRef = useRef(null);
  useEffect(() => {
    if (!('wakeLock' in navigator)) return undefined;
    let cancelled = false;

    const request = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          lock.release();
          return;
        }
        lock.addEventListener('release', () => {
          if (lockRef.current === lock) lockRef.current = null;
        });
        lockRef.current = lock;
      } catch (err) {
        console.warn('Wake lock unavailable:', err);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !lockRef.current) request();
    };

    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      lockRef.current?.release();
      lockRef.current = null;
    };
  }, []);
};

/**
 * The court screen. Teams and bench up top, the two winner buttons under the
 * thumb. After a result the buttons give way to Next Game / Reshoot / End.
 */
const LiveGameScreen = ({ onExit, startWithEnd = false }) => {
  const { session, teams, allPlayers, roster, games, gameNumber, isSaving, actions } = useLiveSession();
  const { toast, confirm } = useUI();
  useWakeLock();

  const [phase, setPhase] = useState('playing'); // 'playing' | 'between'
  const [lastResult, setLastResult] = useState(null);
  const [reshooting, setReshooting] = useState(false);
  const [rotationOpen, setRotationOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(Boolean(startWithEnd));
  const [addOpen, setAddOpen] = useState(false);
  const [standingsOpen, setStandingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [guestSheet, setGuestSheet] = useState(null); // guest name being edited

  const allNames = useMemo(() => allPlayers.map((p) => p.name), [allPlayers]);
  const teamsAreSet = teams.teamA.length > 0 && teams.teamB.length > 0;
  const showSetup = reshooting || !teamsAreSet;
  const noBench = teams.bench.length === 0;
  const streakTeam = TEAMS.find((t) => winStreak(games, t) >= 2);
  const streak = streakTeam ? winStreak(games, streakTeam) : 0;

  const handleWinner = async (team) => {
    try {
      await actions.recordWinner(team);
      navigator.vibrate?.(30);
      setLastResult({ gameNumber, winner: team });
      setPhase('between');
    } catch (error) {
      toast(`Couldn't save that game: ${error.message}`, { type: 'error' });
    }
  };

  const backToPlaying = () => {
    setRotationOpen(false);
    setPhase('playing');
    setLastResult(null);
  };

  // With nobody on the bench the roster can't rotate, so run it back.
  // Reshoot stays one tap away for switching teams up.
  const handleNext = () => (noBench ? backToPlaying() : setRotationOpen(true));

  const handleReshoot = () => {
    setRotationOpen(false);
    setMenuOpen(false);
    setReshooting(true);
  };

  const handleSetupDone = () => {
    setReshooting(false);
    backToPlaying();
  };

  const handleUndo = async () => {
    if (games.length === 0) return;
    const ok = await confirm({
      title: `Undo game ${games.length}?`,
      message: 'The result is removed and the teams go back to how they were for that game.',
      confirmLabel: 'Undo',
      destructive: true
    });
    if (!ok) return;
    try {
      await actions.undoLastGame();
      backToPlaying();
      toast(`Game ${games.length} undone`);
    } catch (error) {
      toast(`Couldn't undo: ${error.message}`, { type: 'error' });
    }
  };

  // One tap, no typing. Guests live only inside tonight.
  const addGuest = async () => {
    const label = nextGuestName(roster);
    try {
      await actions.addPlayer(label, { guest: true });
      toast(`${label} is on the bench`);
    } catch (error) {
      toast(`Couldn't add a guest: ${error.message}`, { type: 'error' });
    }
  };

  const handlePause = async () => {
    if (games.length > 0) {
      const ok = await confirm({
        title: 'Pause this session?',
        message: 'Your games are saved. Resume it from Admin any time.',
        confirmLabel: 'Pause'
      });
      if (!ok) return;
    }
    onExit();
  };

  if (!session) return null;

  const gamesLabel = `${games.length} ${games.length === 1 ? 'game' : 'games'}`;
  const syncLabel = isSaving
    ? 'Saving…'
    : isLocalLiveStore
      ? `Saved on this phone · ${gamesLabel}`
      : `Saved · ${gamesLabel} synced`;

  return (
    <div className="fixed inset-0 z-40 bg-court flex flex-col">
      <header className="shrink-0 px-3 pt-[calc(env(safe-area-inset-top)+6px)] h-[calc(env(safe-area-inset-top)+58px)] flex items-center justify-between">
        <button type="button" onClick={handlePause} className="tap px-2 text-[15px] font-medium text-ink-2">
          Pause
        </button>
        <div className="text-center">
          <div className="display text-[26px] leading-none text-ink font-extrabold">GAME {gameNumber}</div>
          <div className="text-[11px] text-ink-2 mt-0.5">
            {formatDate(session.date)}
            {session.location ? ` · ${session.location}` : ''}
          </div>
        </div>
        <div className="flex gap-1.5">
          {games.length > 0 && <IconButton icon="undo" label="Undo last game" onClick={handleUndo} />}
          <IconButton icon="more" label="More" onClick={() => setMenuOpen(true)} />
        </div>
      </header>

      {streak >= 2 && (
        <p className="text-center text-xs font-semibold text-accent">
          {TEAM_LABELS[streakTeam]} has won {streak} straight
        </p>
      )}

      <main className="flex-1 overflow-y-auto px-4 pt-3 pb-3">
        <div className="grid grid-cols-2 gap-3">
          <TeamCard team="team_a" players={teams.teamA} record={teamRecord(games, 'team_a')} allNames={allNames} onGuestTap={setGuestSheet} />
          <TeamCard team="team_b" players={teams.teamB} record={teamRecord(games, 'team_b')} allNames={allNames} onGuestTap={setGuestSheet} />
        </div>

        <section className="mt-4">
          <div className="flex items-center gap-2 px-1 mb-2">
            <span className="eyebrow">Bench</span>
            <span className="text-[11px] font-semibold text-ink-3 tabular">{teams.bench.length}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {teams.bench.map((p) =>
              isGuest(p.name) ? (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setGuestSheet(p.name)}
                  className="h-9 px-3 rounded-full bg-surface border border-dashed border-line-strong flex items-center gap-2 text-sm font-semibold text-ink-2 italic"
                >
                  {p.name}
                  <span className="text-xs font-medium not-italic tabular">{p.gamesWon}–{p.gamesPlayed - p.gamesWon}</span>
                </button>
              ) : (
                <span key={p.name} className="h-9 px-3 rounded-full bg-surface border border-line flex items-center gap-2 text-sm font-semibold text-ink">
                  {shortName(p.name, allNames)}
                  <span className="text-xs font-medium text-ink-2 tabular">{p.gamesWon}–{p.gamesPlayed - p.gamesWon}</span>
                </span>
              )
            )}
            <button
              type="button"
              onClick={addGuest}
              disabled={isSaving}
              className="h-9 px-3 rounded-full bg-surface-2 text-ink text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Icon name="plus" size={14} /> Guest
            </button>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              aria-label="Add a player from the group"
              className="h-9 w-9 rounded-full bg-surface border border-dashed border-line-strong flex items-center justify-center text-ink-2"
            >
              <Icon name="plus" size={16} />
            </button>
          </div>
        </section>

        <button
          type="button"
          onClick={() => setStandingsOpen(true)}
          className="tap mt-4 w-full h-12 flex items-center justify-between border-t border-line px-1 text-left"
        >
          <span className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-ink">Session standings</span>
            <span className="text-xs text-ink-2 tabular">{gamesLabel}</span>
          </span>
          <Icon name="chevronRight" size={18} className="text-ink-3" />
        </button>
      </main>

      <footer className="shrink-0 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <p className="text-center text-[11px] text-ink-3 mb-2.5">{syncLabel}</p>
        {phase === 'playing' || !lastResult ? (
          <div className="grid grid-cols-2 gap-3">
            <WinnerButton team="team_a" onClick={() => handleWinner('team_a')} disabled={isSaving} />
            <WinnerButton team="team_b" onClick={() => handleWinner('team_b')} disabled={isSaving} />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-center gap-3 mb-1">
              <TeamPill team={lastResult.winner} size="lg" />
              <span className="display text-[28px] leading-none text-ink">wins game {lastResult.gameNumber}</span>
            </div>
            <Button variant="primary" size="lg" className="w-full font-display text-xl tracking-[0.04em]" onClick={handleNext}>
              {noBench ? 'NEXT GAME · SAME TEAMS' : 'NEXT GAME'}
            </Button>
            <div className="grid grid-cols-2">
              <Button variant="ghost" onClick={handleReshoot}>Reshoot teams</Button>
              <Button variant="ghost" onClick={() => setEndOpen(true)}>End session</Button>
            </div>
          </div>
        )}
      </footer>

      {showSetup && (
        <TeamSetupScreen onDone={handleSetupDone} onCancel={teamsAreSet ? () => setReshooting(false) : undefined} />
      )}
      {rotationOpen && lastResult && (
        <RotationScreen
          result={lastResult}
          onDone={backToPlaying}
          onReshoot={handleReshoot}
          onEnd={() => {
            setRotationOpen(false);
            setEndOpen(true);
          }}
          onCancel={() => setRotationOpen(false)}
        />
      )}

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title={`Game ${gameNumber}`}>
        <div className="space-y-2">
          <Button variant="secondary" size="lg" className="w-full justify-start" onClick={() => { setMenuOpen(false); setAddOpen(true); }}>
            <Icon name="plus" /> Add a player
          </Button>
          <Button variant="secondary" size="lg" className="w-full justify-start" onClick={() => { setMenuOpen(false); setStandingsOpen(true); }}>
            <Icon name="list" /> Session standings
          </Button>
          <Button variant="secondary" size="lg" className="w-full justify-start" onClick={handleReshoot}>
            <Icon name="shuffle" /> Reshoot teams
          </Button>
          <Button variant="secondary" size="lg" className="w-full justify-start" onClick={() => { setMenuOpen(false); setEndOpen(true); }}>
            <Icon name="flag" /> End session
          </Button>
        </div>
      </Sheet>
      <AddPlayerSheet open={addOpen} onClose={() => setAddOpen(false)} />
      {guestSheet && <GuestSheet name={guestSheet} onClose={() => setGuestSheet(null)} />}
      <SessionStandingsSheet open={standingsOpen} onClose={() => setStandingsOpen(false)} />
      <EndSessionSheet
        open={endOpen}
        onClose={() => setEndOpen(false)}
        onEnded={() => {
          setEndOpen(false);
          onExit();
        }}
      />
    </div>
  );
};

export default LiveGameScreen;
