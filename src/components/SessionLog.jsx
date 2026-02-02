import { useState } from 'react';
import SessionModal from './SessionModal';
import {
  formatDate,
  calculateWinPercentage,
  getWinPercentageColor
} from '../utils/calculations';

const SessionLog = ({ sessions }) => {
  const [selectedSession, setSelectedSession] = useState(null);

  // Sort sessions by date (newest first)
  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

  const getTopPerformers = (session) => {
    const playersWithWinRate = session.players.map(p => ({
      ...p,
      winPercentage: calculateWinPercentage(p.gamesWon, p.gamesPlayed)
    }));

    const maxWinPercentage = Math.max(...playersWithWinRate.map(p => p.winPercentage));
    return playersWithWinRate.filter(p => p.winPercentage === maxWinPercentage);
  };

  const getGradientColor = (color) => {
    if (color === 'perfect') return 'from-yellow-400 via-amber-500 to-yellow-400';
    if (color === 'excellent') return 'from-green-600 to-emerald-600';
    if (color === 'good') return 'from-yellow-500 to-amber-500';
    if (color === 'fair') return 'from-orange-500 to-orange-600';
    if (color === 'poor') return 'from-red-600 to-red-700';
    if (color === 'default') return 'from-slate-600 to-slate-600';
    return 'from-blue-600 to-indigo-600';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Session History</h2>
        <p className="text-slate-600">Click on a session to view detailed statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedSessions.map((session) => {
          const totalGames = session.totalGames || session.players.reduce((sum, p) => sum + p.gamesPlayed, 0);
          const topPerformers = getTopPerformers(session);
          const topPerformerColor = getWinPercentageColor(topPerformers[0].winPercentage, topPerformers[0].gamesPlayed);

          return (
            <div
              key={session.date}
              onClick={() => setSelectedSession(session)}
              className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100 cursor-pointer"
            >
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{formatDate(session.date)}</h3>
                  {session.location && (
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {session.location}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 rounded-2xl p-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Players</p>
                    <p className="text-2xl font-bold text-slate-900">{session.players.length}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Games</p>
                    <p className="text-2xl font-bold text-slate-900">{totalGames}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    {topPerformers.length > 1 ? 'Top Performers (Tie)' : 'Top Performer'}
                  </p>
                  <div className="space-y-1">
                    {topPerformers.map((performer, index) => (
                      <p key={index} className={`text-lg font-bold bg-gradient-to-r ${getGradientColor(topPerformerColor)} bg-clip-text text-transparent`}>
                        {performer.name}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedSessions.length === 0 && (
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-12 text-center">
          <p className="text-slate-500 font-semibold">No sessions recorded yet</p>
        </div>
      )}

      {selectedSession && (
        <SessionModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
};

export default SessionLog;
