import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { liveSessionStore } from '../lib/liveSessionStore';
import { formatDate, getSessionTotalGames } from '../utils/calculations';
import { useUI } from '../context/ui-context';
import EditSessionModal from './EditSessionModal';
import StartLiveSessionSheet from './LiveSession/StartLiveSessionSheet';
import { useActiveLiveSession } from './LiveSession/useActiveLiveSession';
import Button from './ui/Button';
import Icon from './ui/Icon';

const ManageSessions = ({ sessions, locations, onSessionUpdated, onDeleteSession, playerStats }) => {
  const navigate = useNavigate();
  const { toast, confirm } = useUI();
  const active = useActiveLiveSession();
  const [editingSession, setEditingSession] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStart, setShowStart] = useState(false);

  const handleDelete = async (session) => {
    const ok = await confirm({
      title: 'Delete this session?',
      message: `${formatDate(session.date)} comes out of everyone's history and the standings.`,
      confirmLabel: 'Delete',
      destructive: true
    });
    if (!ok) return;

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('sessions').delete().eq('id', session.id);
        if (error) throw error;
      }
      if (onDeleteSession) onDeleteSession(session.date);
    } catch (error) {
      toast(`Couldn't delete the session: ${error.message}`, { type: 'error' });
    }
  };

  const handleDiscardLive = async () => {
    if (!active.session) return;
    const ok = await confirm({
      title: 'Discard this live session?',
      message: 'Its games are deleted and nothing is added to the standings.',
      confirmLabel: 'Discard',
      destructive: true
    });
    if (!ok) return;
    try {
      await liveSessionStore.deleteSession(active.session.id);
      await active.refresh();
      toast('Live session discarded');
    } catch (error) {
      toast(`Couldn't discard the session: ${error.message}`, { type: 'error' });
    }
  };

  const sorted = [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1));
  const startedLabel = active.startedAt
    ? active.startedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-ink">Sessions</h3>
          <p className="text-sm text-ink-2 mt-0.5">Run a night live, or enter one by hand.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="primary" size="lg" onClick={() => setShowStart(true)} disabled={Boolean(active.session)}>
          <Icon name="play" size={18} /> Live session
        </Button>
        <Button variant="secondary" size="lg" onClick={() => setShowAddModal(true)}>
          <Icon name="plus" size={18} /> Add by hand
        </Button>
      </div>

      {active.session && (
        <div className={`p-4 rounded-2xl border ${active.isStale ? 'border-accent bg-accent-soft' : 'border-line-strong bg-surface-2'}`}>
          <p className="font-bold text-ink">
            {active.isStale ? `Unfinished session from ${formatDate(active.session.date)}` : 'Live session in progress'}
          </p>
          <p className="text-sm text-ink-2 mt-1 tabular">
            {active.gameCount} {active.gameCount === 1 ? 'game' : 'games'} recorded
            {active.session.location ? ` at ${active.session.location}` : ''}
            {active.isStale
              ? '. It was never ended, so it is not in the standings yet.'
              : startedLabel
                ? ` · started ${startedLabel}`
                : ''}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {active.isStale ? (
              <>
                <Button variant="primary" onClick={() => navigate('/admin/live?end=1')}>Finish &amp; save</Button>
                <Button variant="secondary" onClick={() => navigate('/admin/live')}>Resume</Button>
              </>
            ) : (
              <Button variant="primary" onClick={() => navigate('/admin/live')}>Resume</Button>
            )}
            <Button variant="ghost" onClick={handleDiscardLive}>Discard</Button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-line overflow-hidden">
        {sorted.length === 0 ? (
          <p className="text-ink-2 text-sm text-center py-8">No sessions yet</p>
        ) : (
          sorted.map((session) => (
            <div key={session.id || session.live_session_id || session.date} className="flex items-center gap-3 px-4 py-3 border-t border-line first:border-t-0">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink">{formatDate(session.date)}</p>
                <p className="text-xs text-ink-2 tabular truncate">
                  {session.players.length} players · {getSessionTotalGames(session)} games
                  {session.location ? ` · ${session.location}` : ''}
                </p>
              </div>
              <Button variant="ghost" onClick={() => handleDelete(session)} className="text-danger hover:text-danger">Delete</Button>
              <Button variant="secondary" onClick={() => setEditingSession(session)}>Edit</Button>
            </div>
          ))
        )}
      </div>

      {!isSupabaseConfigured() && (
        <p className="text-xs text-ink-3">Supabase is not configured. Live sessions are saved on this phone only.</p>
      )}

      {showAddModal && (
        <EditSessionModal session={null} locations={locations} onClose={() => setShowAddModal(false)} onSessionUpdated={onSessionUpdated} playerStats={playerStats} />
      )}
      {editingSession && (
        <EditSessionModal session={editingSession} locations={locations} onClose={() => setEditingSession(null)} onSessionUpdated={onSessionUpdated} playerStats={playerStats} />
      )}

      {showStart && (
        <StartLiveSessionSheet
          onClose={() => setShowStart(false)}
          onStarted={(session) => {
            setShowStart(false);
            navigate(`/admin/live?session=${encodeURIComponent(session.id)}`);
          }}
        />
      )}
    </div>
  );
};

export default ManageSessions;
