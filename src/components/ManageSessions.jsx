import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import EditSessionModal from './EditSessionModal';
import StartLiveSessionModal from './LiveSession/StartLiveSessionModal';
import LiveSessionWrapper from './LiveSession/LiveSessionWrapper';
import { LiveSessionProvider } from './LiveSession/LiveSessionContext';
import { formatDateString } from '../utils/dateFormatter';
import { useUI } from '../context/ui-context';

const ManageSessions = ({ sessions, locations, onSessionUpdated, onDeleteSession, playerStats }) => {
  const { toast, confirm } = useUI();
  const [editingSession, setEditingSession] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLiveSessionModal, setShowLiveSessionModal] = useState(false);
  const [activeLiveSession, setActiveLiveSession] = useState(null);
  const [activeSessionGameCount, setActiveSessionGameCount] = useState(0);
  const [isInLiveSession, setIsInLiveSession] = useState(false);
  const [openEndModalOnResume, setOpenEndModalOnResume] = useState(false);

  // Look for a live session that was never ended. It is never auto-abandoned:
  // an old one is shown as unfinished so its games can still be saved.
  const checkActiveSessions = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setActiveLiveSession(null);
        setActiveSessionGameCount(0);
        return;
      }

      const { count } = await supabase
        .from('games')
        .select('id', { count: 'exact', head: true })
        .eq('live_session_id', data.id);

      setActiveLiveSession(data);
      setActiveSessionGameCount(count || 0);
    } catch {
      setActiveLiveSession(null);
      setActiveSessionGameCount(0);
    }
  }, []);

  useEffect(() => {
    checkActiveSessions();
  }, [checkActiveSessions]);

  const handleDelete = async (session) => {
    const ok = await confirm({
      title: 'Delete this session?',
      message: `${formatDateString(session.date)} comes out of everyone's history and the standings.`,
      confirmLabel: 'Delete',
      destructive: true
    });
    if (!ok) return;

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('sessions')
          .delete()
          .eq('id', session.id);

        if (error) throw error;

        if (onDeleteSession) onDeleteSession(session.date);
      } else {
        if (onDeleteSession) onDeleteSession(session.date);
      }
    } catch (error) {
      toast(`Couldn't delete the session: ${error.message}`, { type: 'error' });
    }
  };

  const handleLiveSessionStarted = async (session) => {
    setActiveLiveSession(session);
    setIsInLiveSession(true);
  };

  const handleExitLiveSession = async () => {
    setIsInLiveSession(false);
    setOpenEndModalOnResume(false);
    setActiveLiveSession(null);
    setShowLiveSessionModal(false);

    // Re-check: the session is still active if the admin only paused it
    await checkActiveSessions();

    if (onSessionUpdated) onSessionUpdated();
  };

  const handleResumeLiveSession = (openEndModal = false) => {
    setOpenEndModalOnResume(openEndModal);
    setIsInLiveSession(true);
  };

  const handleDiscardLiveSession = async () => {
    if (!activeLiveSession) return;
    const ok = await confirm({
      title: 'Discard this live session?',
      message: 'Its games are deleted and nothing is added to the standings.',
      confirmLabel: 'Discard',
      destructive: true
    });
    if (!ok) return;

    try {
      const { error } = await supabase
        .from('live_sessions')
        .delete()
        .eq('id', activeLiveSession.id);

      if (error) throw error;

      setActiveLiveSession(null);
      setActiveSessionGameCount(0);
      localStorage.removeItem('liveSessionBackup');
    } catch (error) {
      toast(`Couldn't discard the session: ${error.message}`, { type: 'error' });
    }
  };

  // A session started more than 12 hours ago was almost certainly forgotten, not paused
  const activeSessionStart = activeLiveSession
    ? new Date(activeLiveSession.started_at || activeLiveSession.created_at)
    : null;
  const activeSessionStartValid = Boolean(activeSessionStart && !isNaN(activeSessionStart.getTime()));
  const activeSessionIsStale = activeSessionStartValid &&
    (Date.now() - activeSessionStart.getTime()) / (1000 * 60 * 60) > 12;
  const activeSessionStartLabel = activeSessionStartValid
    ? activeSessionStart.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

  // If in live session, show the interface
  if (isInLiveSession) {
    return (
      <LiveSessionProvider>
        <LiveSessionWrapper
          sessionId={activeLiveSession?.id}
          onExit={handleExitLiveSession}
          startWithEndModal={openEndModalOnResume}
        />
      </LiveSessionProvider>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-ink">Manage Sessions</h3>
          <p className="text-ink-2 mt-1">View, add, edit, and delete basketball sessions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowLiveSessionModal(true)}
            className="px-5 py-2.5 bg-accent text-accent-ink rounded-xl font-semibold text-sm hover:shadow-lg transition-all whitespace-nowrap"
          >
            ▶ Start Live Session
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-accent text-accent-ink rounded-xl font-semibold text-sm hover:shadow-lg transition-all whitespace-nowrap"
          >
            + Add Session
          </button>
        </div>
      </div>

      {/* Active or unfinished live session */}
      {activeLiveSession && (
        <div className={`p-4 rounded-xl border-2 ${activeSessionIsStale ? 'bg-accent-soft border-line-strong' : 'bg-accent-soft border-line-strong'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <p className={`font-bold ${activeSessionIsStale ? 'text-accent' : 'text-accent'}`}>
                {activeSessionIsStale
                  ? `Unfinished session from ${formatDateString(activeLiveSession.date)}`
                  : 'Active Live Session'}
              </p>
              <p className={`text-sm mt-1 ${activeSessionIsStale ? 'text-ink-2' : 'text-accent'}`}>
                {activeSessionGameCount} {activeSessionGameCount === 1 ? 'game' : 'games'} recorded
                {activeLiveSession.location && ` at ${activeLiveSession.location}`}
                {activeSessionIsStale
                  ? '. It was never ended, so it is not in the standings yet.'
                  : activeSessionStartLabel && ` · started ${activeSessionStartLabel}`}
              </p>
            </div>
            <div className="flex gap-3 sm:gap-4 items-center">
              <button
                onClick={handleDiscardLiveSession}
                className="text-danger font-semibold text-sm hover:text-danger transition-colors whitespace-nowrap"
              >
                Discard
              </button>
              <button
                onClick={() => handleResumeLiveSession(false)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors whitespace-nowrap ${
                  activeSessionIsStale
                    ? 'bg-surface-2 text-ink hover:bg-line-strong'
                    : 'bg-accent text-accent-ink hover:brightness-110'
                }`}
              >
                Resume
              </button>
              {activeSessionIsStale && (
                <button
                  onClick={() => handleResumeLiveSession(true)}
                  className="px-5 py-2.5 bg-accent text-accent-ink rounded-xl font-semibold text-sm hover:brightness-110 transition-colors whitespace-nowrap"
                >
                  Finish &amp; Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sortedSessions.length === 0 ? (
          <p className="text-ink-2 text-center py-8">No sessions added yet</p>
        ) : (
          sortedSessions.map((session) => (
            <div key={session.id || session.live_session_id || session.date} className="p-4 bg-surface-2 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <p className="font-bold text-ink">{formatDateString(session.date)}</p>
                  <p className="text-sm text-ink-2">
                    {session.players.length} players • {Math.max(...session.players.map(p => p.gamesPlayed), 0)} games
                    {session.location && ` • ${session.location}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    onClick={() => handleDelete(session)}
                    className="text-danger font-semibold text-sm hover:text-danger transition-colors whitespace-nowrap"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setEditingSession(session)}
                    className="px-4 py-2 bg-surface-2 text-ink rounded-xl font-semibold text-sm hover:bg-line-strong transition-colors whitespace-nowrap"
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
        <div className="p-4 bg-accent-soft border-2 border-line-strong rounded-xl">
          <p className="text-ink-2 font-semibold">
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
