import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/data-context';
import { aggregateGuests } from '../utils/guests';
import { formatDate, formatWinPercentage } from '../utils/calculations';
import Avatar from '../components/ui/Avatar';
import Icon from '../components/ui/Icon';
import WinBars from '../components/ui/WinBars';

const Tile = ({ label, value }) => (
  <div className="bg-surface rounded-xl px-3 py-2.5">
    <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">{label}</div>
    <div className="display text-[26px] leading-none mt-1.5 text-ink">{value}</div>
  </div>
);

/** /guests — everyone who's dropped in, added up, then night by night. */
const GuestsPage = () => {
  const navigate = useNavigate();
  const { sessions } = useData();
  const totals = useMemo(() => aggregateGuests(sessions), [sessions]);

  const losses = totals.gamesPlayed - totals.gamesWon;
  const recent = totals.nights.slice(-10);
  const lastNight = totals.nights[totals.nights.length - 1];

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

      <div className="flex items-center gap-4 px-5 pt-4">
        <Avatar name="Guests" size={72} className="border border-dashed border-line-strong" />
        <div className="min-w-0">
          <h1 className="display text-4xl leading-none text-ink font-extrabold">Guests</h1>
          <div className="text-[13px] text-ink-2 mt-1.5">Everyone who's dropped in, added up. Not ranked.</div>
        </div>
      </div>

      {totals.gamesPlayed === 0 ? (
        <p className="px-5 pt-8 text-ink-2">No guests have played yet. Add them from the court with the Guest button.</p>
      ) : (
        <>
          <div className="px-5 pt-5">
            <div className="display text-[72px] leading-[0.9] tracking-tight text-ink font-extrabold">
              {formatWinPercentage(totals.winPercentage, totals.gamesPlayed)}
            </div>
            <div className="eyebrow mt-1.5 tabular">Win rate · {totals.gamesWon}–{losses}</div>
          </div>

          <div className="grid grid-cols-4 gap-2 px-5 pt-5">
            <Tile label="Games" value={totals.gamesPlayed} />
            <Tile label="Wins" value={totals.gamesWon} />
            <Tile label="Nights" value={totals.nights.length} />
            <Tile label="Spots" value={totals.appearances} />
          </div>

          {recent.length > 0 && (
            <div className="px-5 pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="eyebrow">Last {recent.length} {recent.length === 1 ? 'night' : 'nights'}</div>
                <div className="text-[11px] text-ink-3">Guests' win rate that night</div>
              </div>
              <div className="border-b border-line">
                <WinBars sessions={recent} slots={recent.length} height={72} gap={5} />
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[11px] tabular">
                <span className="text-ink-3">{formatDate(recent[0].date)}</span>
                <span className="text-accent">
                  {formatDate(lastNight.date)} · {lastNight.gamesWon}–{lastNight.gamesPlayed - lastNight.gamesWon}
                </span>
              </div>
            </div>
          )}

          <div className="px-5 pt-6">
            <div className="eyebrow mb-2">Night by night</div>
            {[...totals.nights].reverse().map((night) => (
              <Link
                key={night.key}
                to={`/sessions/${encodeURIComponent(night.key)}`}
                className="flex items-center gap-3 py-3 border-t border-line active:bg-surface-raised"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-ink">
                    {formatDate(night.date)}
                    {night.location && <span className="text-ink-2 font-normal"> · {night.location}</span>}
                  </div>
                  <div className="text-xs text-ink-2 tabular mt-1 leading-relaxed">
                    {night.guests.map((g, i) => (
                      <span key={g.name + i} className="whitespace-nowrap">
                        {i > 0 && <span className="text-ink-3 mx-1.5">·</span>}
                        <span className="italic">{g.name}</span>
                        <span className="text-ink font-semibold ml-1.5">{g.gamesWon}–{g.gamesPlayed - g.gamesWon}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="display w-16 text-right text-xl text-ink">
                  {formatWinPercentage(night.winPercentage, night.gamesPlayed)}
                </div>
                <Icon name="chevronRight" size={16} className="text-ink-3 shrink-0" />
              </Link>
            ))}
            <div className="border-t border-line" />
          </div>
        </>
      )}
    </div>
  );
};

export default GuestsPage;
