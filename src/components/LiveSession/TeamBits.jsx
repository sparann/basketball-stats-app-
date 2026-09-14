import Icon from '../ui/Icon';
import { TEAM_LABELS } from '../../utils/liveStats';

/** LIGHT is a white pill, DARK a charcoal one: tells apart at arm's length in a gym. */
export const TeamPill = ({ team, size = 'sm' }) => {
  const dims = size === 'lg' ? 'h-[30px] px-3 text-base' : 'h-[26px] px-2.5 text-sm';
  const look = team === 'team_a' ? 'bg-ink text-court' : 'bg-court text-ink border border-line-strong';
  return (
    <span className={`inline-flex items-center rounded-full font-display font-extrabold tracking-[0.06em] ${dims} ${look}`}>
      {TEAM_LABELS[team].toUpperCase()}
    </span>
  );
};

/** The two big buttons in the thumb zone. */
export const WinnerButton = ({ team, onClick, disabled }) => {
  const light = team === 'team_a';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-[88px] rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-transform active:scale-[0.98] disabled:opacity-50 ${
        light ? 'bg-ink text-court' : 'bg-surface text-ink border-[1.5px] border-line-strong'
      }`}
    >
      <span className="font-display font-extrabold text-[26px] leading-none tracking-[0.04em]">
        {TEAM_LABELS[team].toUpperCase()}
      </span>
      <span className={`text-xs font-semibold tracking-[0.1em] ${light ? 'text-ink-3' : 'text-ink-2'}`}>WON</span>
    </button>
  );
};

const TONES = {
  neutral: 'bg-court text-ink',
  surface: 'bg-surface text-ink',
  light: 'bg-ink text-court',
  dark: 'bg-court text-ink border-[1.5px] border-ink',
  selected: 'bg-surface-raised text-ink border-[1.5px] border-accent'
};

/** Tappable player row for the setup and rotation screens. */
export const PlayerChip = ({ label, record, selected = false, tone = 'neutral', disabled = false, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={selected}
    className={`tap w-full h-11 px-3 rounded-[10px] flex items-center justify-between gap-2 text-[15px] font-semibold text-left transition-colors disabled:opacity-40 ${
      TONES[selected ? 'selected' : tone]
    }`}
  >
    <span className="truncate">{label}</span>
    <span className="flex items-center gap-2 shrink-0">
      {record && <span className="text-xs font-medium opacity-70 tabular">{record}</span>}
      {selected && <Icon name="check" size={16} strokeWidth={2.5} className="text-accent" />}
    </span>
  </button>
);
