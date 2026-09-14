import Icon from './Icon';
import { useTheme } from '../../context/theme';

/**
 * Compact page header: brand eyebrow, theme switch, big condensed title, optional action on the right.
 * Padded for the status bar when installed to the home screen.
 */
const PageHeader = ({ title, action, badge, eyebrow = "Wyatt's Win Tracker" }) => {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';

  return (
    <header className="px-5 pt-[calc(env(safe-area-inset-top)+12px)] pb-2">
      <div className="flex items-center justify-between mb-1">
        <div className="eyebrow">{eyebrow}</div>
        <div className="flex items-center gap-2">
          {badge}
          <button
            type="button"
            onClick={toggle}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={!dark}
            className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-ink-2 hover:text-ink hover:bg-surface transition-colors"
          >
            <Icon name={dark ? 'sun' : 'moon'} size={18} />
          </button>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <h1 className="display text-[40px] leading-none text-ink font-extrabold">{title}</h1>
        {action}
      </div>
    </header>
  );
};

export default PageHeader;
