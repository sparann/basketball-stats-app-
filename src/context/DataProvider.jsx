import { useCallback, useEffect, useRef, useState } from 'react';
import { DataContext } from './data-context';
import { useUI } from './ui-context';
import { aggregatePlayerStats } from '../utils/calculations';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { renamePlayerEverywhere } from '../lib/renamePlayer';
import statsData from '../data/stats.json';

const readJSON = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const EMPTY_STATS = {
  totalGamesPlayed: 0,
  totalGamesWon: 0,
  sessionsAttended: 0,
  overallWinPercentage: 0,
  lastPlayed: null,
  sessions: []
};

/**
 * Local sessions for development. With VITE_DEV_SAMPLE_DATA=true in .env.local
 * the sample fixture loads instead of the empty stats.json. The import is
 * inside a DEV guard so production builds never include the fixture.
 */
const loadLocalSessions = async () => {
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_SAMPLE_DATA === 'true') {
    const sample = await import('../data/sample-sessions.json');
    return sample.default.sessions;
  }
  return statsData.sessions;
};

export const DataProvider = ({ children }) => {
  const { toast } = useUI();

  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('isAdmin') === 'true');

  // Name-keyed extras that predate the players table. Kept as a fallback for
  // local development and for rows that never had the columns filled in.
  const [injuredPlayers, setInjuredPlayers] = useState(() => readJSON('injuredPlayers', {}));
  const [playerPictures, setPlayerPictures] = useState(() => readJSON('playerPictures', {}));
  const [playerDetails, setPlayerDetails] = useState(() => readJSON('playerDetails', {}));
  const [locations, setLocations] = useState(() => readJSON('locations', []));

  const mergeLocations = (sessionList) => {
    const fromSessions = sessionList.map((s) => s.location).filter(Boolean);
    const merged = [...new Set([...locations, ...fromSessions])];
    if (merged.length !== locations.length) {
      setLocations(merged);
      writeJSON('locations', merged);
    }
  };

  const withExtras = (player, fromTable = {}) => ({
    ...player,
    injured: fromTable.injured !== undefined ? fromTable.injured : (injuredPlayers[player.name] || false),
    pictureUrl: fromTable.pictureUrl || playerPictures[player.name] || '',
    height: fromTable.height || playerDetails[player.name]?.height || '',
    weight: fromTable.weight || playerDetails[player.name]?.weight || ''
  });

  const loadLocal = async () => {
    const localSessions = await loadLocalSessions();
    setSessions(localSessions);
    mergeLocations(localSessions);
    setPlayers(aggregatePlayerStats(localSessions).map((p) => withExtras(p)));
  };

  const loadData = async () => {
    setIsLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        await loadLocal();
        return;
      }

      const [playersResult, sessionsResult] = await Promise.all([
        supabase.from('players').select('*').order('name', { ascending: true }),
        supabase.from('sessions').select('*').order('date', { ascending: true })
      ]);

      if (playersResult.error) throw playersResult.error;
      if (sessionsResult.error) throw sessionsResult.error;

      const sessionsData = sessionsResult.data || [];
      const playersData = playersResult.data || [];

      setSessions(sessionsData);
      mergeLocations(sessionsData);

      // Standings are built from the players table, with stats aggregated from sessions
      const statsByName = new Map(aggregatePlayerStats(sessionsData).map((p) => [p.name, p]));
      setPlayers(
        playersData.map((row) =>
          withExtras({ name: row.name, ...(statsByName.get(row.name) || EMPTY_STATS) }, row)
        )
      );
    } catch (error) {
      console.error('Error loading data:', error);
      await loadLocal();
    } finally {
      setIsLoading(false);
    }
  };

  // Keep a stable `refresh` so pages can call it from effects without loops
  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;
  const refresh = useCallback(() => loadDataRef.current(), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(() => {
    sessionStorage.setItem('isAdmin', 'true');
    setIsAdmin(true);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('isAdmin');
    setIsAdmin(false);
  }, []);

  const updatePlayer = async (updatedPlayer) => {
    // EditPlayerModal sends previousName when the name field changed. Everything
    // else in the app is keyed by name, so a rename has to be propagated.
    const previousName = updatedPlayer.previousName || updatedPlayer.name;
    const newName = updatedPlayer.name;
    const renamed = previousName !== newName;

    const playerForState = { ...updatedPlayer };
    delete playerForState.previousName;

    const rekey = (map, value) => {
      const next = { ...map };
      if (renamed) delete next[previousName];
      next[newName] = value;
      return next;
    };

    const nextInjured = rekey(injuredPlayers, updatedPlayer.injured);
    setInjuredPlayers(nextInjured);
    writeJSON('injuredPlayers', nextInjured);

    const nextPictures = rekey(playerPictures, updatedPlayer.pictureUrl || '');
    setPlayerPictures(nextPictures);
    writeJSON('playerPictures', nextPictures);

    const nextDetails = rekey(playerDetails, {
      height: updatedPlayer.height || '',
      weight: updatedPlayer.weight || ''
    });
    setPlayerDetails(nextDetails);
    writeJSON('playerDetails', nextDetails);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('players')
          .update({
            name: newName,
            injured: updatedPlayer.injured || false,
            pictureUrl: updatedPlayer.pictureUrl || '',
            height: updatedPlayer.height || '',
            weight: updatedPlayer.weight || ''
          })
          .eq('name', previousName);

        if (error) throw error;

        if (renamed) {
          await renamePlayerEverywhere(previousName, newName);
        }
      } catch (error) {
        console.error('Error updating player in Supabase:', error);
        toast(`Couldn't save ${newName}: ${error.message}`, { type: 'error' });
        return false;
      }
    }

    const exists = players.some((p) => p.name === previousName);
    if (exists) {
      setPlayers((current) =>
        current.map((p) =>
          p.name === previousName
            ? {
                ...p,
                name: newName,
                injured: updatedPlayer.injured,
                pictureUrl: updatedPlayer.pictureUrl,
                height: updatedPlayer.height || '',
                weight: updatedPlayer.weight || ''
              }
            : p
        )
      );
    } else {
      setPlayers((current) => [...current, playerForState]);
    }

    // Session rows carry names too, so standings need a refetch after a rename
    if (renamed) {
      await refresh();
    }
    return true;
  };

  const deletePlayer = async (playerName) => {
    try {
      if (isSupabaseConfigured()) {
        const { error: playerError } = await supabase.from('players').delete().eq('name', playerName);
        if (playerError) throw playerError;

        const { data: allSessions, error: fetchError } = await supabase.from('sessions').select('*');
        if (fetchError) throw fetchError;

        for (const session of allSessions || []) {
          const remaining = (session.players || []).filter((p) => p.name !== playerName);
          if (remaining.length === (session.players || []).length) continue;

          const query = remaining.length > 0
            ? supabase.from('sessions').update({ players: remaining }).eq('id', session.id)
            : supabase.from('sessions').delete().eq('id', session.id);

          const { error } = await query;
          if (error) throw error;
        }
      }

      const drop = (map) => {
        const next = { ...map };
        delete next[playerName];
        return next;
      };
      const nextInjured = drop(injuredPlayers);
      setInjuredPlayers(nextInjured);
      writeJSON('injuredPlayers', nextInjured);
      const nextPictures = drop(playerPictures);
      setPlayerPictures(nextPictures);
      writeJSON('playerPictures', nextPictures);
      const nextDetails = drop(playerDetails);
      setPlayerDetails(nextDetails);
      writeJSON('playerDetails', nextDetails);

      await refresh();
      toast(`${playerName} removed`);
    } catch (error) {
      console.error('Error deleting player:', error);
      toast(`Couldn't remove ${playerName}: ${error.message}`, { type: 'error' });
    }
  };

  const addLocation = (location) => {
    const next = [...locations, location];
    setLocations(next);
    writeJSON('locations', next);
  };

  const editLocation = (oldLocation, newLocation) => {
    const next = locations.map((loc) => (loc === oldLocation ? newLocation : loc));
    setLocations(next);
    writeJSON('locations', next);
    setSessions((current) =>
      current.map((s) => ({ ...s, location: s.location === oldLocation ? newLocation : s.location }))
    );
  };

  const removeLocation = (location) => {
    const next = locations.filter((loc) => loc !== location);
    setLocations(next);
    writeJSON('locations', next);
  };

  const value = {
    players,
    sessions,
    locations,
    isLoading,
    isAdmin,
    login,
    logout,
    refresh,
    updatePlayer,
    deletePlayer,
    addLocation,
    editLocation,
    removeLocation
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
