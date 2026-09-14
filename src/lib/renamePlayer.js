import { supabase } from './supabase';

/**
 * Rename a player everywhere their name is stored.
 *
 * Names are the join key across tables until players get ids, so a rename has
 * to touch sessions (jsonb player list), live_session_players, and the roster
 * arrays on games. Each table is updated row by row, keyed on primary key.
 */
export const renamePlayerEverywhere = async (oldName, newName) => {
  if (!oldName || !newName || oldName === newName) return;

  const swap = (name) => (name === oldName ? newName : name);

  // sessions.players jsonb
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id, players');
  if (sessionsError) throw sessionsError;

  for (const session of sessions || []) {
    const list = Array.isArray(session.players) ? session.players : [];
    if (!list.some(p => p.name === oldName)) continue;

    const players = list.map(p => (p.name === oldName ? { ...p, name: newName } : p));
    const { error } = await supabase.from('sessions').update({ players }).eq('id', session.id);
    if (error) throw error;
  }

  // live_session_players.player_name
  const { error: liveError } = await supabase
    .from('live_session_players')
    .update({ player_name: newName })
    .eq('player_name', oldName);
  if (liveError) throw liveError;

  // games roster arrays
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id, team_a_players, team_b_players, sitting_out_players');
  if (gamesError) throw gamesError;

  for (const game of games || []) {
    const rosters = [game.team_a_players, game.team_b_players, game.sitting_out_players];
    if (!rosters.some(list => Array.isArray(list) && list.includes(oldName))) continue;

    const { error } = await supabase
      .from('games')
      .update({
        team_a_players: (game.team_a_players || []).map(swap),
        team_b_players: (game.team_b_players || []).map(swap),
        sitting_out_players: (game.sitting_out_players || []).map(swap)
      })
      .eq('id', game.id);
    if (error) throw error;
  }
};
