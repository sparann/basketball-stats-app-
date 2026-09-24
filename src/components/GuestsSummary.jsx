import { Link } from 'react-router-dom';
import { formatWinPercentage } from '../utils/calculations';
import Avatar from './ui/Avatar';
import Sparkline from './ui/Sparkline';
import WinBars from './ui/WinBars';

const nightsLabel = (n) => `${n} ${n === 1 ? 'night' : 'nights'}`;

/** The combined guests record as a Standings card. Unranked, dashed so it reads as a group. */
export const GuestsCard = ({ totals }) => {
  const losses = totals.gamesPlayed - totals.gamesWon;
  return (
    <Link to="/guests" className="block bg-surface rounded-2xl p-4 border border-dashed border-line-strong active:bg-surface-raised">
      <div className="flex items-start gap-3">
        <Avatar name="Guests" size={44} className="border border-dashed border-line-strong" />
        <div className="flex-1 min-w-0">
          <div className="text-[17px] font-semibold leading-tight text-ink truncate">Guests</div>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Everyone who's dropped in</div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 mt-4">
        <div>
          <div className="display text-[44px] leading-[0.9] tracking-tight text-ink font-extrabold">
            {formatWinPercentage(totals.winPercentage, totals.gamesPlayed)}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3 mt-1.5">Win rate</div>
        </div>
        <div className="text-right text-xs text-ink-2 tabular leading-relaxed">
          <div><span className="text-ink font-semibold">{totals.gamesWon}–{losses}</span> record</div>
          <div>Played on <span className="text-ink font-semibold">{totals.nights.length}</span> {totals.nights.length === 1 ? 'night' : 'nights'}</div>
          <div><span className="text-ink font-semibold">{totals.appearances}</span> guest spots</div>
        </div>
      </div>

      <div className="mt-4">
        <WinBars sessions={totals.nights} slots={5} height={28} labels={false} />
      </div>
    </Link>
  );
};

/** The combined guests record as a list row. */
export const GuestsRow = ({ totals }) => {
  const losses = totals.gamesPlayed - totals.gamesWon;
  return (
    <Link to="/guests" className="flex items-center gap-3 h-[60px] px-5 border-t border-line active:bg-surface-raised">
      <div className="display w-[26px] text-[22px] leading-none text-ink-3">·</div>
      <Avatar name="Guests" size={36} className="border border-dashed border-line-strong" />
      <div className="flex-1 min-w-0">
        <div className="text-[16px] font-semibold leading-tight text-ink truncate">Guests</div>
        <div className="tabular text-xs text-ink-2 leading-tight mt-0.5">
          {totals.gamesWon}–{losses} · {nightsLabel(totals.nights.length)}
        </div>
      </div>
      <div className="flex flex-col items-end gap-[5px]">
        <div className="display text-2xl leading-none text-ink">{formatWinPercentage(totals.winPercentage, totals.gamesPlayed)}</div>
        <Sparkline values={totals.nights.map((n) => n.winPercentage)} />
      </div>
    </Link>
  );
};
