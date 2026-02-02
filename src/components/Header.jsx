const Header = ({ currentView, onViewChange, isAdmin }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="app-title">
          <span className="basketball-icon">🏀</span>
          Basketball Stats Tracker
        </h1>

        <nav className="nav-tabs">
          <button
            className={`nav-tab ${currentView === 'summary' ? 'active' : ''}`}
            onClick={() => onViewChange('summary')}
          >
            Player Summary
          </button>
          <button
            className={`nav-tab ${currentView === 'sessions' ? 'active' : ''}`}
            onClick={() => onViewChange('sessions')}
          >
            Session Log
          </button>
          <button
            className={`nav-tab ${currentView === 'admin' ? 'active' : ''}`}
            onClick={() => onViewChange('admin')}
          >
            {isAdmin ? '📝 Admin' : '🔒 Admin'}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
