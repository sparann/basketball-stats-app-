const Header = ({ currentView, onViewChange, isAdmin }) => {
  return (
    <header className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b-2 border-slate-700">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-5xl font-extrabold text-white tracking-tight mb-2">
              Basketball Win Tracker
            </h1>
            <p className="text-slate-300 font-semibold">Tracking Pickup Games. Courtesy of: Wyatt</p>
          </div>
        </div>

        <nav className="flex gap-3">
          <button
            className={`px-6 py-3 ${
              currentView === 'summary'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'bg-slate-800 border-2 border-slate-600 text-slate-200'
            } rounded-xl font-semibold text-sm hover:shadow-md transition-all`}
            onClick={() => onViewChange('summary')}
          >
            Player Summary
          </button>
          <button
            className={`px-6 py-3 ${
              currentView === 'sessions'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'bg-slate-800 border-2 border-slate-600 text-slate-200'
            } rounded-xl font-semibold text-sm hover:shadow-md transition-all`}
            onClick={() => onViewChange('sessions')}
          >
            Sessions
          </button>
          <button
            className={`px-6 py-3 ${
              currentView === 'admin'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'bg-slate-800 border-2 border-slate-600 text-slate-200'
            } rounded-xl font-semibold text-sm hover:shadow-md transition-all`}
            onClick={() => onViewChange('admin')}
          >
            Admin
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
