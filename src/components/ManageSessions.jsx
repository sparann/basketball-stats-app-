import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import EditSessionModal from './EditSessionModal';
import StartLiveSessionModal from './LiveSession/StartLiveSessionModal';
import LiveSessionWrapper from './LiveSession/LiveSessionWrapper';
import { LiveSessionProvider } from './LiveSession/LiveSessionContext';
import { formatDateString } from '../utils/dateFormatter';

const ManageSessions = ({ sessions, locations, onSessionUpdated, onDeleteSession, playerStats }) => {
  const [editingSession, setEditingSession] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLiveSessionModal, setShowLiveSessionModal] = useState(false);
  const [activeLiveSession, setActiveLiveSession] = useState(null);
  const [isInLiveSession, setIsInLiveSession] = useState(false);

  // Check for active live sessions on mount
  useEffect(() => {
    const checkActiveSessions = async () => {
      if (!isSupabaseConfigured()) return;

      try {
        const { data, error } = await supabase
          .from('live_sessions')
          .select('*')
          .eq('status', 'active')
          .order('started_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          // Use started_at or fallback to created_at
          const sessionStart = data.started_at
            ? new Date(data.started_at)
            : data.created_at
            ? new Date(data.created_at)
            : null;

          if (!sessionStart || isNaN(sessionStart.getTime())) {
            // Invalid timestamp - mark as abandoned
            await supabase
              .from('live_sessions')
              .update({ status: 'abandoned' })
              .eq('id', data.id);
            setActiveLiveSession(null);
            return;
          }

          const now = new Date();
          const hoursDiff = (now - sessionStart) / (1000 * 60 * 60);

          if (hoursDiff > 24) {
            // Mark stale session as abandoned
            await supabase
              .from('live_sessions')
              .update({ status: 'abandoned' })
              .eq('id', data.id);
            setActiveLiveSession(null);
          } else {
            setActiveLiveSession(data);
          }
        }
      } catch (error) {
        // No active sessions found
      }
    };

    checkActiveSessions();
  }, []);

  const handleDelete = async (session) => {
    if (!window.confirm(`Are you sure you want to delete the session from ${formatDateString(session.date)}?`)) {
      return;
    }

    try {
      if (isSupabaseConfigured()) {
        // If session has a live_session_id, use that to delete uniquely
        // Otherwise fall back to date (for legacy sessions)
        let query = supabase.from('sessions').delete();

        if (session.live_session_id) {
          query = query.eq('live_session_id', session.live_session_id);
        } else {
          query = query.eq('date', session.date);
        }

        const { error } = await query;

        if (error) throw error;

        if (onDeleteSession) onDeleteSession(session.date);
      } else {
        if (onDeleteSession) onDeleteSession(session.date);
      }
    } catch (error) {
      alert(`Error deleting session: ${error.message}`);
    }
  };

  const handleLiveSessionStarted = async (session) => {
    setActiveLiveSession(session);
    setIsInLiveSession(true);
  };

  const handleExitLiveSession = async () => {
    setIsInLiveSession(false);
    setActiveLiveSession(null);
    setShowLiveSessionModal(false);

    // Re-check for active sessions after exiting
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('live_sessions')
          .select('*')
          .eq('status', 'active')
          .order('started_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          setActiveLiveSession(data);
        } else {
          setActiveLiveSession(null);
        }
      } catch (error) {
        setActiveLiveSession(null);
      }
    }

    if (onSessionUpdated) onSessionUpdated();
  };

  const handleResumeLiveSession = () => {
    setIsInLiveSession(true);
  };

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

  // If in live session, show the interface
  if (isInLiveSession) {
    return (
      <LiveSessionProvider>
        <LiveSessionWrapper
          sessionId={activeLiveSession?.id}
          onExit={handleExitLiveSession}
        />
      </LiveSessionProvider>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Manage Sessions</h3>
          <p className="text-slate-600 mt-1">View, add, edit, and delete basketball sessions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowLiveSessionModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all whitespace-nowrap"
          >
            ▶ Start Live Session
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all whitespace-nowrap"
          >
            + Add Session
          </button>
        </div>
      </div>

      {/* Active Session Warning */}
      {activeLiveSession && (
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <p className="text-green-800 font-bold">
                ⚡ Active Live Session
              </p>
              <p className="text-green-600 text-sm mt-1">
                Started {new Date(activeLiveSession.started_at).toLocaleString()}
                {activeLiveSession.location && ` at ${activeLiveSession.location}`}
              </p>
            </div>
            <div className="flex gap-3 sm:gap-4 items-center">
              <button
                onClick={async () => {
                  if (!window.confirm('Delete this live session? This cannot be undone and all game data will be lost.')) {
                    return;
                  }

                  try {
                    const { error } = await supabase
                      .from('live_sessions')
                      .delete()
                      .eq('id', activeLiveSession.id);

                    if (error) throw error;

                    setActiveLiveSession(null);
                    localStorage.removeItem('liveSessionBackup');
                    alert('Live session deleted successfully');
                  } catch (error) {
                    alert(`Error deleting live session: ${error.message}`);
                  }
                }}
                className="text-red-600 font-semibold text-sm hover:text-red-700 transition-colors whitespace-nowrap"
              >
                Delete
              </button>
              <button
                onClick={handleResumeLiveSession}
                className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sortedSessions.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No sessions added yet</p>
        ) : (
          sortedSessions.map((session) => (
            <div key={session.live_session_id || session.date} className="p-4 bg-slate-50 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{formatDateString(session.date)}</p>
                  <p className="text-sm text-slate-500">
                    {session.players.length} players • {Math.max(...session.players.map(p => p.gamesPlayed), 0)} games
                    {session.location && ` • ${session.location}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    onClick={() => handleDelete(session)}
                    className="text-red-600 font-semibold text-sm hover:text-red-700 transition-colors whitespace-nowrap"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setEditingSession(session)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors whitespace-nowrap"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!isSupabaseConfigured() && (
        <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
          <p className="text-amber-700 font-semibold">
            Supabase is not configured yet. Follow the setup guide to enable database storage.
          </p>
        </div>
      )}

      {showAddModal && (
        <EditSessionModal
          session={null}
          locations={locations}
          onClose={() => setShowAddModal(false)}
          onSessionUpdated={onSessionUpdated}
          playerStats={playerStats}
        />
      )}

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          locations={locations}
          onClose={() => setEditingSession(null)}
          onSessionUpdated={onSessionUpdated}
          playerStats={playerStats}
        />
      )}

      {showLiveSessionModal && (
        <LiveSessionProvider>
          <StartLiveSessionModal
            locations={locations}
            playerStats={playerStats}
            onClose={() => setShowLiveSessionModal(false)}
            onSessionStarted={handleLiveSessionStarted}
          />
        </LiveSessionProvider>
      )}
    </div>
  );
};

export default ManageSessions;
