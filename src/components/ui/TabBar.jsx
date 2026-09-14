import { NavLink } from 'react-router-dom';
import Icon from './Icon';

const TABS = [
  { to: '/', label: 'Standings', icon: 'list', end: true },
  { to: '/sessions', label: 'Sessions', icon: 'calendar' },
  { to: '/admin', label: 'Admin', icon: 'lock' },
];

const TabBar = () => (
  <nav
    className="fixed bottom-0 inset-x-0 z-30 bg-court/95 backdrop-blur border-t border-line pb-safe"
    aria-label="Main"
  >
    <div className="max-w-2xl mx-auto grid grid-cols-3 px-3 pt-1.5">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 h-14 rounded-xl text-[11px] font-semibold transition-colors ${
              isActive ? 'text-accent' : 'text-ink-3 hover:text-ink-2'
            }`
          }
        >
          <Icon name={tab.icon} size={24} strokeWidth={1.75} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);

export default TabBar;
