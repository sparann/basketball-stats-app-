import { useState } from 'react';
import ManageSessions from './ManageSessions';
import ManagePlayers from './ManagePlayers';
import ManageLocations from './ManageLocations';

const AdminPanel = ({
  onLogout,
  onSessionAdded,
  playerStats,
  onUpdatePlayer,
  onDeletePlayer,
  sessions,
  locations,
  onAddLocation,
  onEditLocation,
  onRemoveLocation,
  onDeleteSession
}) => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('adminActiveTab') || 'sessions';
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('adminActiveTab', tab);
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Admin Panel</h2>
            <button
              onClick={onLogout}
              className="px-3 sm:px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors whitespace-nowrap"
            >
              Logout
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => handleTabChange('sessions')}
              className={`px-5 py-2.5 whitespace-nowrap ${activeTab === 'sessions' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-slate-100 text-slate-700'} rounded-xl font-semibold text-sm hover:shadow-md transition-all`}
            >
              Sessions
            </button>
            <button
              onClick={() => handleTabChange('players')}
              className={`px-5 py-2.5 whitespace-nowrap ${activeTab === 'players' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-slate-100 text-slate-700'} rounded-xl font-semibold text-sm hover:shadow-md transition-all`}
            >
              Players
            </button>
            <button
              onClick={() => handleTabChange('locations')}
              className={`px-5 py-2.5 whitespace-nowrap ${activeTab === 'locations' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-slate-100 text-slate-700'} rounded-xl font-semibold text-sm hover:shadow-md transition-all`}
            >
              Locations
            </button>
          </div>
        </div>

        {activeTab === 'sessions' && (
          <div className="p-4 sm:p-6">
            <ManageSessions
              sessions={sessions}
              locations={locations}
              onSessionUpdated={onSessionAdded}
              onDeleteSession={onDeleteSession}
              playerStats={playerStats}
            />
          </div>
        )}

        {activeTab === 'players' && (
          <div className="p-4 sm:p-6">
            <ManagePlayers
              players={playerStats}
              onUpdatePlayer={onUpdatePlayer}
              onDeletePlayer={onDeletePlayer}
            />
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="p-4 sm:p-6">
            <ManageLocations
              locations={locations}
              onAddLocation={onAddLocation}
              onEditLocation={onEditLocation}
              onRemoveLocation={onRemoveLocation}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
