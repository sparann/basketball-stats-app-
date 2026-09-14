import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Storage for live sessions. With Supabase configured, rows live in
 * live_sessions / live_session_players / games. Without it (local
 * development), the same shape is kept in localStorage so the courtside
 * screens can be used and tested offline.
 *
 * Stats are never stored: they are derived from the game rows.
 */

const LOCAL_KEY = 'liveSessionLocal';
const emptyDb = () => ({ sessions: [], roster: {}, games: {} });

const readLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || emptyDb();
  } catch {
    return emptyDb();
  }
};
const writeLocal = (db) => localStorage.setItem(LOCAL_KEY, JSON.stringify(db));
const uid = () =>
  globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const localBackend = {
  async findActiveSession() {
    const db = readLocal();
    const active = db.sessions
      .filter((s) => s.status === 'active')
      .sort((a, b) => (a.started_at < b.started_at ? 1 : -1))[0];
    if (!active) return null;
    return { session: active, gameCount: (db.games[active.id] || []).length };
  },

  async createSession({ date, location, names }) {
    const db = readLocal();
    const now = new Date().toISOString();
    const session = { id: uid(), date, location: location || null, status: 'active', started_at: now, created_at: now };
    db.sessions.push(session);
    db.roster[session.id] = [...names];
    db.games[session.id] = [];
    writeLocal(db);
    return session;
  },

  async loadSession(id) {
    const db = readLocal();
    const session = db.sessions.find((s) => s.id === id);
    if (!session) throw new Error('That session is not on this phone');
    return { session, roster: db.roster[id] || [], games: db.games[id] || [] };
  },

  async insertGame(game) {
    const db = readLocal();
    const row = { ...game, id: uid(), played_at: new Date().toISOString() };
    db.games[game.live_session_id] = [...(db.games[game.live_session_id] || []), row];
    writeLocal(db);
    return row;
  },

  async deleteGame(sessionId, gameId) {
    const db = readLocal();
    db.games[sessionId] = (db.games[sessionId] || []).filter((g) => g.id !== gameId);
    writeLocal(db);
  },

  async addRosterPlayer(sessionId, name) {
    const db = readLocal();
    const roster = db.roster[sessionId] || [];
    if (!roster.includes(name)) roster.push(name);
    db.roster[sessionId] = roster;
    writeLocal(db);
  },

  async listPlayerNames() {
    return [];
  },

  async completeSession(session, aggregated) {
    const db = readLocal();
    const row = db.sessions.find((s) => s.id === session.id);
    if (row) {
      row.status = 'completed';
      row.ended_at = new Date().toISOString();
    }
    writeLocal(db);
    return aggregated;
  },

  async deleteSession(id) {
    const db = readLocal();
    db.sessions = db.sessions.filter((s) => s.id !== id);
    delete db.roster[id];
    delete db.games[id];
    writeLocal(db);
  },

  subscribeToGames() {
    return () => {};
  }
};

const supabaseBackend = {
  async findActiveSession() {
    const { data, error } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const { count } = await supabase
      .from('games')
      .select('id', { count: 'exact', head: true })
      .eq('live_session_id', data.id);
    return { session: data, gameCount: count || 0 };
  },

  async createSession({ date, location, names }) {
    const { data: session, error } = await supabase
      .from('live_sessions')
      .insert({ date, location: location || null, status: 'active', started_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;

    if (names.length > 0) {
      const { error: rosterError } = await supabase
        .from('live_session_players')
        .insert(names.map((name) => ({ live_session_id: session.id, player_name: name })));
      if (rosterError) throw rosterError;
    }
    return session;
  },

  async loadSession(id) {
    const [s, r, g] = await Promise.all([
      supabase.from('live_sessions').select('*').eq('id', id).single(),
      supabase.from('live_session_players').select('player_name').eq('live_session_id', id).order('created_at'),
      supabase.from('games').select('*').eq('live_session_id', id).order('game_number')
    ]);
    if (s.error) throw s.error;
    if (r.error) throw r.error;
    if (g.error) throw g.error;
    return { session: s.data, roster: (r.data || []).map((x) => x.player_name), games: g.data || [] };
  },

  async insertGame(game) {
    const { data, error } = await supabase.from('games').insert(game).select().single();
    if (error) throw error;
    return data;
  },

  async deleteGame(sessionId, gameId) {
    const { error } = await supabase.from('games').delete().eq('id', gameId).eq('live_session_id', sessionId);
    if (error) throw error;
  },

  async addRosterPlayer(sessionId, name) {
    // Standings are built from players, so a brand-new name needs a row there
    const { data: existing, error: lookupError } = await supabase
      .from('players')
      .select('name')
      .eq('name', name)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) {
      const { error } = await supabase.from('players').insert({ name });
      if (error) throw error;
    }

    const { error } = await supabase
      .from('live_session_players')
      .insert({ live_session_id: sessionId, player_name: name });
    if (error) throw error;
  },

  async listPlayerNames() {
    const { data, error } = await supabase.from('players').select('name').order('name');
    if (error) throw error;
    return (data || []).map((p) => p.name);
  },

  async completeSession(session, aggregated) {
    // Idempotent: a retry after a failure updates instead of duplicating
    const { data: existing, error: lookupError } = await supabase
      .from('sessions')
      .select('id')
      .eq('live_session_id', session.id)
      .maybeSingle();
    if (lookupError) throw lookupError;

    const write = existing
      ? supabase.from('sessions').update(aggregated).eq('id', existing.id)
      : supabase.from('sessions').insert(aggregated);
    const { error } = await write;
    if (error) throw new Error(`Couldn't save the session: ${error.message}`);

    const { error: statusError } = await supabase
      .from('live_sessions')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('id', session.id);
    if (statusError) throw statusError;

    return aggregated;
  },

  async deleteSession(id) {
    const { error } = await supabase.from('live_sessions').delete().eq('id', id);
    if (error) throw error;
  },

  /** Realtime game inserts/deletes for the spectator page. Needs the table in the realtime publication. */
  subscribeToGames(sessionId, onChange) {
    const channel = supabase
      .channel(`games-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `live_session_id=eq.${sessionId}` },
        onChange
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }
};

export const isLocalLiveStore = !isSupabaseConfigured();
export const liveSessionStore = isLocalLiveStore ? localBackend : supabaseBackend;
