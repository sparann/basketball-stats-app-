import { useState } from 'react';
import {
  formatWinPercentage,
  formatDate,
  getWinPercentageColor,
  calculateWinPercentage
} from '../utils/calculations';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const PlayerModal = ({ player, onClose, onToggleInjured, onUpdatePicture, sessions }) => {
  if (!player) return null;

  const [showMenu, setShowMenu] = useState(false);
  const [uploading, setUploading] = useState(false);

  const winPercentageColor = getWinPercentageColor(player.overallWinPercentage, player.totalGamesPlayed);

  // Calculate best location
  const getBestLocation = () => {
    if (!sessions || sessions.length === 0) return null;

    const locationStats = {};

    sessions.forEach(session => {
      if (!session.location) return;

      const playerInSession = session.players.find(p => p.name === player.name);
      if (!playerInSession) return;

      if (!locationStats[session.location]) {
        locationStats[session.location] = { gamesPlayed: 0, gamesWon: 0 };
      }
      locationStats[session.location].gamesPlayed += playerInSession.gamesPlayed;
      locationStats[session.location].gamesWon += playerInSession.gamesWon;
    });

    let bestLocation = null;
    let bestWinRate = -1;

    Object.entries(locationStats).forEach(([location, stats]) => {
      if (stats.gamesPlayed >= 5) { // Only consider locations with at least 5 games
        const winRate = stats.gamesWon / stats.gamesPlayed;
        if (winRate > bestWinRate) {
          bestWinRate = winRate;
          bestLocation = { name: location, winRate, ...stats };
        }
      }
    });

    return bestLocation;
  };

  const bestLocation = getBestLocation();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }

    setUploading(true);

    try {
      if (!isSupabaseConfigured()) {
        alert('Supabase is not configured');
        setUploading(false);
        return;
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `player-photos/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('basketball-stats')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('basketball-stats')
        .getPublicUrl(filePath);

      if (onUpdatePicture) {
        onUpdatePicture(urlData.publicUrl);
      }
      setUploading(false);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.message || 'Failed to upload image');
      setUploading(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <label className="cursor-pointer group relative" title="Click to change picture">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {player.pictureUrl ? (
                    <img
                      src={player.pictureUrl}
                      alt={player.name}
                      className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-slate-100 group-hover:border-blue-300 transition-colors"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-2xl sm:text-3xl font-bold border-4 border-slate-100 group-hover:border-blue-300 transition-colors">
                      {getInitials(player.name)}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploading ? 'Uploading...' : 'Edit'}
                    </span>
                  </div>
                </label>
                {(player.height || player.weight) && (
                  <p className="text-xs text-slate-500 hidden sm:block">
                    {player.height && <span>{player.height}</span>}
                    {player.height && player.weight && <span> • </span>}
                    {player.weight && <span>{player.weight}</span>}
                  </p>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-3xl font-bold text-slate-900 mb-1 sm:mb-2 truncate">{player.name}</h2>
                <div className={`text-3xl sm:text-5xl font-extrabold bg-gradient-to-r ${getGradientColor(winPercentageColor)} bg-clip-text text-transparent ${winPercentageColor === 'perfect' ? 'drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]' : ''}`}>
                  {formatWinPercentage(player.overallWinPercentage, player.totalGamesPlayed)}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide">Overall Win Rate</p>
              </div>
            </div>
            <div className="flex items-start gap-1 sm:gap-2 flex-shrink-0">
              {/* 3-dot menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0" onClick={() => setShowMenu(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-10">
                      <button
                        onClick={() => {
                          onToggleInjured();
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={player.injured || false}
                          onChange={() => {}}
                          className="w-4 h-4 accent-blue-600"
                        />
                        Mark as injured
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-3xl font-bold transition-colors p-1 w-10 h-10 flex items-center justify-center flex-shrink-0"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Games</p>
              <p className="text-3xl font-bold text-slate-900">{player.totalGamesPlayed}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Wins</p>
              <p className="text-3xl font-bold text-slate-900">{player.totalGamesWon}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Losses</p>
              <p className="text-3xl font-bold text-slate-900">{player.totalGamesPlayed - player.totalGamesWon}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-slate-900">{player.sessionsAttended}</p>
            </div>
          </div>
        </div>

        {/* Session History */}
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Session History</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {player.sessions.slice().reverse().map((session, index) => {
              const sessionColor = getWinPercentageColor(session.winPercentage, session.gamesPlayed);
              const sessionGradient = getGradientColor(sessionColor);

              return (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-16 h-16 bg-gradient-to-br ${sessionGradient} rounded-xl flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">{formatWinPercentage(session.winPercentage, session.gamesPlayed)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{formatDate(session.date)}</p>
                      <p className="text-sm text-slate-500">
                        {session.gamesWon} wins out of {session.gamesPlayed} games
                        {session.location && <span> • {session.location}</span>}
                      </p>
                    </div>
                  </div>
                  {session.notes && (
                    <p className="text-sm text-slate-500 italic max-w-xs truncate">{session.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Best Location */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Best Location</h3>
          {bestLocation ? (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-blue-50 border-2 border-blue-100 rounded-xl">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-bold text-slate-900">{bestLocation.name}</p>
                <p className="text-sm text-slate-600">
                  {formatWinPercentage(bestLocation.winRate, bestLocation.gamesPlayed)} win rate • {bestLocation.gamesWon}/{bestLocation.gamesPlayed} games
                </p>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No location data available (requires 5+ games at a location)</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;
