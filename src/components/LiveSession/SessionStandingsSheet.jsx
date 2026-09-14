import { useMemo } from 'react';
import { useLiveSession } from './LiveSessionContext';
import { sessionStandings, teamRecord } from '../../utils/liveStats';
import { shortName } from '../../utils/names';
import Sheet from '../ui/Sheet';
import { TeamPill } from './TeamBits';

/** Tonight's leaderboard and the game log, one tap from the court screen. */
const SessionStandingsSheet = ({ open, onClose }) => {
  const { games, allPlayers } = useLiveSession();
  const standings = useMemo(() => sessionStandings(allPlayers), [allPlayers]);
  const names = allPlayers.map((p) => p.name);
  const a = teamRecord(games, 'team_a');
  const b = teamRecord(games, 'team_b');

  return (
    <Sheet open={open} onClose={onClose} title="Tonight" size="lg">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-court rounded-xl px-3 py-2.5 flex items-center justify-between">
          <TeamPill team="team_a" />
          <span className="display text-2xl text-ink">{a.wins}–{a.losses}</span>
        </div>
        <div className="bg-court rounded-xl px-3 py-2.5 flex items-center justify-between">
          <TeamPill team="team_b" />
          <span className="display text-2xl text-ink">{b.wins}–{b.losses}</span>
        </div>
      </div>

      <div className="eyebrow mt-4 mb-2">Players</div>
      <div className="rounded-xl bg-court">
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

      {games.length > 0 && (
        <>
          <div className="eyebrow mt-4 mb-2">Games</div>
          <div className="rounded-xl bg-court">
            {[...games].reverse().map((g) => (
              <div key={g.id || g.game_number} className="flex items-center gap-3 h-11 px-3 border-t border-line first:border-t-0">
                <span className="text-xs font-semibold text-ink-3 tabular w-14">Game {g.game_number}</span>
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
          </div>
        </>
      )}
    </Sheet>
  );
};

export default SessionStandingsSheet;
