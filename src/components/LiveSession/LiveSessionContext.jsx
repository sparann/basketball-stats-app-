import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const LiveSessionContext = createContext(null);

export const useLiveSession = () => {
  const context = useContext(LiveSessionContext);
  if (!context) {
    throw new Error('useLiveSession must be used within LiveSessionProvider');
  }
  return context;
};

export const LiveSessionProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState({
    teamA: [],
    teamB: [],
    sittingOut: []
  });
  const [gameNumber, setGameNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate win streaks
  const getWinStreak = useCallback((team) => {
    let streak = 0;
    // Count backwards from most recent game
    for (let i = games.length - 1; i >= 0; i--) {
      if (games[i].winning_team === team) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [games]);

  // Auto-save to localStorage for offline support
  useEffect(() => {
    if (session) {
      const backup = {
        session,
        games,
        players,
        gameNumber,
        timestamp: Date.now()
      };
      localStorage.setItem('liveSessionBackup', JSON.stringify(backup));
    }
  }, [session, games, players, gameNumber]);

  // Initialize new session
  const startSession = useCallback(async (date, location, selectedPlayers) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create live session in database
      const now = new Date().toISOString();
      const { data: newSession, error: sessionError } = await supabase
        .from('live_sessions')
        .insert({
          date,
          location,
          status: 'active',
          started_at: now
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Insert all players
      const playerInserts = selectedPlayers.map(playerName => ({
        live_session_id: newSession.id,
        player_name: playerName,
        total_games_played: 0,
        total_games_won: 0
      }));

      const { error: playersError } = await supabase
        .from('live_session_players')
        .insert(playerInserts);

      if (playersError) throw playersError;

      // Initialize player objects with stats
      const playerObjects = selectedPlayers.map(name => ({
        name,
        gamesPlayed: 0,
        gamesWon: 0
      }));

      setSession(newSession);
      setPlayers({
        teamA: [],
        teamB: [],
        sittingOut: playerObjects
      });
      setGameNumber(1);
      setGames([]);

      return newSession;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Resume existing session
  const resumeSession = useCallback(async (sessionId) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch session
      const { data: sessionData, error: sessionError } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from('live_session_players')
        .select('*')
        .eq('live_session_id', sessionId);

      if (playersError) throw playersError;

      // Fetch games
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .eq('live_session_id', sessionId)
        .order('game_number', { ascending: true });

      if (gamesError) throw gamesError;

      // Reconstruct state from last game
      const lastGame = gamesData[gamesData.length - 1];
      const playerObjects = playersData.map(p => ({
        name: p.player_name,
        gamesPlayed: p.total_games_played,
        gamesWon: p.total_games_won
      }));

      setSession(sessionData);
      setGames(gamesData);
      setGameNumber(gamesData.length + 1);

      if (lastGame && Array.isArray(lastGame.team_a_players) && Array.isArray(lastGame.team_b_players)) {
        // Reconstruct teams from last game
        const teamA = playerObjects.filter(p =>
          lastGame.team_a_players.includes(p.name)
        );
        const teamB = playerObjects.filter(p =>
          lastGame.team_b_players.includes(p.name)
        );
        const sittingOut = playerObjects.filter(p =>
          !lastGame.team_a_players.includes(p.name) &&
          !lastGame.team_b_players.includes(p.name)
        );

        setPlayers({ teamA, teamB, sittingOut });
      } else {
        // No valid games or empty arrays - all players sit
        setPlayers({
          teamA: [],
          teamB: [],
          sittingOut: playerObjects
        });
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update team rosters
  const updateRoster = useCallback((updates) => {
    setPlayers(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Mark game winner and save
  const markWinner = useCallback(async (winningTeam) => {
    if (!session) return;

    setIsLoading(true);
    setError(null);

    try {
      // Save game record
      const gameData = {
        live_session_id: session.id,
        game_number: gameNumber,
        team_a_players: players.teamA.map(p => p.name),
        team_b_players: players.teamB.map(p => p.name),
        sitting_out_players: players.sittingOut.map(p => p.name),
        winning_team: winningTeam
      };

      const { error: gameError } = await supabase
        .from('games')
        .insert(gameData);

      if (gameError) throw gameError;

      // Update player stats using batch operations
      const winningPlayers = winningTeam === 'team_a' ? players.teamA : players.teamB;
      const losingPlayers = winningTeam === 'team_a' ? players.teamB : players.teamA;

      // Prepare all updates in a single batch
      const allUpdates = [];

      // Prepare winner updates
      for (const player of winningPlayers) {
        allUpdates.push({
          live_session_id: session.id,
          player_name: player.name,
          total_games_played: player.gamesPlayed + 1,
          total_games_won: player.gamesWon + 1
        });
      }

      // Prepare loser updates
      for (const player of losingPlayers) {
        allUpdates.push({
          live_session_id: session.id,
          player_name: player.name,
          total_games_played: player.gamesPlayed + 1,
          total_games_won: player.gamesWon
        });
      }

      // Execute all updates as batch using upsert
      const { error: updateError } = await supabase
        .from('live_session_players')
        .upsert(allUpdates, {
          onConflict: 'live_session_id,player_name'
        });

      if (updateError) {
        console.error('Failed to update player stats:', updateError);
        throw updateError;
      }

      // Update local state optimistically
      setPlayers(prev => ({
        ...prev,
        teamA: prev.teamA.map(p => ({
          ...p,
          gamesPlayed: p.gamesPlayed + 1,
          gamesWon: p.gamesWon + (winningTeam === 'team_a' ? 1 : 0)
        })),
        teamB: prev.teamB.map(p => ({
          ...p,
          gamesPlayed: p.gamesPlayed + 1,
          gamesWon: p.gamesWon + (winningTeam === 'team_b' ? 1 : 0)
        }))
      }));

      setGames(prev => [...prev, gameData]);
      setGameNumber(prev => prev + 1);

      return { winningTeam, losingTeam: winningTeam === 'team_a' ? 'team_b' : 'team_a' };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session, gameNumber, players]);

  // Undo last game
  const undoLastGame = useCallback(async () => {
    if (!session || games.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const lastGame = games[games.length - 1];

      // Delete game record
      const { error: deleteError } = await supabase
        .from('games')
        .delete()
        .eq('live_session_id', session.id)
        .eq('game_number', lastGame.game_number);

      if (deleteError) throw deleteError;

      // Revert player stats
      const winningPlayers = lastGame.winning_team === 'team_a'
        ? lastGame.team_a_players
        : lastGame.team_b_players;
      const allPlayers = [...lastGame.team_a_players, ...lastGame.team_b_players];

      for (const playerName of allPlayers) {
        const wasWinner = winningPlayers.includes(playerName);
        const player = [...players.teamA, ...players.teamB, ...players.sittingOut]
          .find(p => p.name === playerName);

        if (player) {
          await supabase
            .from('live_session_players')
            .update({
              total_games_played: Math.max(0, player.gamesPlayed - 1),
              total_games_won: Math.max(0, player.gamesWon - (wasWinner ? 1 : 0))
            })
            .eq('live_session_id', session.id)
            .eq('player_name', playerName);
        }
      }

      // Update local state
      setGames(prev => prev.slice(0, -1));
      setGameNumber(prev => Math.max(1, prev - 1));

      // Restore previous roster
      if (games.length > 1) {
        const previousGame = games[games.length - 2];
        const allPlayerObjects = [...players.teamA, ...players.teamB, ...players.sittingOut];

        setPlayers({
          teamA: previousGame.team_a_players.map(name =>
            allPlayerObjects.find(p => p.name === name)
          ),
          teamB: previousGame.team_b_players.map(name =>
            allPlayerObjects.find(p => p.name === name)
          ),
          sittingOut: previousGame.sitting_out_players.map(name =>
            allPlayerObjects.find(p => p.name === name)
          )
        });
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session, games, players]);

  // End session and convert to legacy format
  const endSession = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    setError(null);

    try {
      // Mark session as completed
      const { error: updateError } = await supabase
        .from('live_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (updateError) throw updateError;

      // Fetch final player stats
      const { data: finalPlayers, error: playersError } = await supabase
        .from('live_session_players')
        .select('*')
        .eq('live_session_id', session.id);

      if (playersError) throw playersError;

      // Convert to legacy sessions format with validation
      const aggregatedSession = {
        live_session_id: session.id, // Add unique ID for this session
        date: session.date,
        location: session.location || null,
        players: finalPlayers.map(p => ({
          name: p.player_name,
          gamesPlayed: p.total_games_played,
          gamesWon: p.total_games_won,
          notes: p.notes || ''
        }))
      };

      console.log('💾 Preparing to save session:', aggregatedSession);

      // Validate required fields
      if (!aggregatedSession.date) {
        throw new Error('Session date is required for saving');
      }

      if (!aggregatedSession.players || aggregatedSession.players.length === 0) {
        throw new Error('Session must have at least one player');
      }

      console.log('✅ Validation passed, inserting into sessions table...');

      const { data: insertedSession, error: sessionInsertError } = await supabase
        .from('sessions')
        .insert(aggregatedSession)
        .select();

      if (sessionInsertError) {
        console.error('❌ Failed to save session:', sessionInsertError);
        throw new Error(`Failed to save session: ${sessionInsertError.message}`);
      }

      console.log('✅ Session saved successfully:', insertedSession);

      // Clear localStorage backup
      localStorage.removeItem('liveSessionBackup');

      // Clear state
      setSession(null);
      setGames([]);
      setPlayers({ teamA: [], teamB: [], sittingOut: [] });
      setGameNumber(1);

      return aggregatedSession;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Abandon session without saving
  const abandonSession = useCallback(async () => {
    if (!session) return;

    try {
      await supabase
        .from('live_sessions')
        .update({ status: 'abandoned' })
        .eq('id', session.id);

      localStorage.removeItem('liveSessionBackup');
      setSession(null);
      setGames([]);
      setPlayers({ teamA: [], teamB: [], sittingOut: [] });
      setGameNumber(1);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [session]);

  const value = {
    session,
    games,
    players,
    gameNumber,
    isLoading,
    error,
    getWinStreak,
    actions: {
      startSession,
      resumeSession,
      updateRoster,
      markWinner,
      undoLastGame,
      endSession,
      abandonSession
    }
  };

  return (
    <LiveSessionContext.Provider value={value}>
      {children}
    </LiveSessionContext.Provider>
  );
};

export default LiveSessionContext;
