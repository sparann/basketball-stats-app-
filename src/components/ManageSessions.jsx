import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import EditSessionModal from './EditSessionModal';

const ManageSessions = ({ sessions, locations, onSessionUpdated, onDeleteSession }) => {
  const [editingSession, setEditingSession] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleDelete = async (sessionDate) => {
    if (!window.confirm(`Are you sure you want to delete the session from ${new Date(sessionDate).toLocaleDateString()}?`)) {
      return;
    }

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('sessions')
          .delete()
          .eq('date', sessionDate);

        if (error) throw error;

        if (onDeleteSession) onDeleteSession(sessionDate);
      } else {
        if (onDeleteSession) onDeleteSession(sessionDate);
      }
    } catch (error) {
      alert(`Error deleting session: ${error.message}`);
    }
  };

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Manage Sessions</h3>
          <p className="text-slate-600 mt-1">View, add, edit, and delete basketball sessions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
        >
          + Add Session
        </button>
      </div>

      <div className="space-y-3">
        {sortedSessions.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No sessions added yet</p>
        ) : (
          sortedSessions.map((session) => (
            <div key={session.date} className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{new Date(session.date).toLocaleDateString()}</p>
                  <p className="text-sm text-slate-500">
                    {session.players.length} players • {session.players.reduce((sum, p) => sum + p.gamesPlayed, 0)} games
                    {session.location && ` • ${session.location}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingSession(session)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(session.date)}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
                  >
                    Delete
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
        />
      )}

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          locations={locations}
          onClose={() => setEditingSession(null)}
          onSessionUpdated={onSessionUpdated}
        />
      )}
    </div>
  );
};

export default ManageSessions;
