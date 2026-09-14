import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { liveSessionStore } from '../../lib/liveSessionStore';
import { deriveSessionStats, lineupFromGames, lineupProblem } from '../../utils/liveStats';

const LiveSessionContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs beside its provider
export const useLiveSession = () => {
  const context = useContext(LiveSessionContext);
  if (!context) {
    throw new Error('useLiveSession must be used within LiveSessionProvider');
  }
  return context;
};

/**
 * State for one courtside session.
 *
 * The source of truth is the list of game rows. Player records, team
 * records and the end-of-night summary are all derived from it, so
 * recording a game is one insert and undoing it is one delete.
 */
export const LiveSessionProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [roster, setRoster] = useState([]); // player names in this session
  const [games, setGames] = useState([]);
  const [lineup, setLineup] = useState({ teamA: [], teamB: [], bench: [] }); // names
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const statsByName = useMemo(
    () => new Map(deriveSessionStats(games, roster).map((p) => [p.name, p])),
    [games, roster]
  );
  const toPlayer = useCallback(
    (name) => statsByName.get(name) || { name, gamesPlayed: 0, gamesWon: 0 },
    [statsByName]
  );

  const teams = useMemo(
    () => ({
      teamA: lineup.teamA.map(toPlayer),
      teamB: lineup.teamB.map(toPlayer),
      bench: lineup.bench.map(toPlayer)
    }),
    [lineup, toPlayer]
  );
  const allPlayers = useMemo(() => roster.map(toPlayer), [roster, toPlayer]);
  const gameNumber = games.length + 1;

  const run = async (setBusy, work) => {
    setBusy(true);
    setError(null);
    try {
      return await work();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const startSession = useCallback(
    (date, location, names) =>
      run(setIsLoading, async () => {
        const created = await liveSessionStore.createSession({ date, location, names });
        setSession(created);
        setRoster([...names]);
        setGames([]);
        setLineup({ teamA: [], teamB: [], bench: [...names] });
        return created;
      }),
    []
  );

  const resumeSession = useCallback(
    (id) =>
      run(setIsLoading, async () => {
        const loaded = await liveSessionStore.loadSession(id);
        setSession(loaded.session);
        setRoster(loaded.roster);
        setGames(loaded.games);
        setLineup(lineupFromGames(loaded.games, loaded.roster));
        return loaded.session;
      }),
    []
  );

  /** Replace the lineup. Returns the problem string if it is not usable. */
  const updateLineup = useCallback(
    (next) => {
      const problem = lineupProblem(next, roster);
      if (problem) return problem;
      setLineup({ teamA: [...next.teamA], teamB: [...next.teamB], bench: [...next.bench] });
      return null;
    },
    [roster]
  );

  const recordWinner = useCallback(
    (team) =>
      run(setIsSaving, async () => {
        if (!session) throw new Error('No session');
        if (lineup.teamA.length === 0 || lineup.teamB.length === 0) throw new Error('Pick both teams first');
        const row = await liveSessionStore.insertGame({
          live_session_id: session.id,
          game_number: games.length + 1,
          team_a_players: lineup.teamA,
          team_b_players: lineup.teamB,
          sitting_out_players: lineup.bench,
          winning_team: team
        });
        setGames((current) => [...current, row]);
        return row;
      }),
    [session, games.length, lineup]
  );

  const undoLastGame = useCallback(
    () =>
      run(setIsSaving, async () => {
        const last = games[games.length - 1];
        if (!session || !last) return null;
        await liveSessionStore.deleteGame(session.id, last.id);
        setGames((current) => current.slice(0, -1));
        // Put the teams back the way they were for the undone game
        setLineup(lineupFromGames([last], roster));
        return last;
      }),
    [session, games, roster]
  );

  const addPlayer = useCallback(
    (name) =>
      run(setIsSaving, async () => {
        if (!session) throw new Error('No session');
        await liveSessionStore.addRosterPlayer(session.id, name);
        setRoster((current) => [...current, name]);
        setLineup((current) => ({ ...current, bench: [...current.bench, name] }));
      }),
    [session]
  );

  const endSession = useCallback(
    () =>
      run(setIsSaving, async () => {
        if (!session) throw new Error('No session');
        const aggregated = {
          live_session_id: session.id,
          date: session.date,
          location: session.location || null,
          players: deriveSessionStats(games, roster).map((p) => ({
            name: p.name,
            gamesPlayed: p.gamesPlayed,
            gamesWon: p.gamesWon,
            notes: ''
          }))
        };
        await liveSessionStore.completeSession(session, aggregated);
        setSession(null);
        setRoster([]);
        setGames([]);
        setLineup({ teamA: [], teamB: [], bench: [] });
        return aggregated;
      }),
    [session, games, roster]
  );

  const value = {
    session,
    roster,
    games,
    lineup,
    teams,
    allPlayers,
    gameNumber,
    isLoading,
    isSaving,
    error,
    actions: { startSession, resumeSession, updateLineup, recordWinner, undoLastGame, addPlayer, endSession }
  };

  return <LiveSessionContext.Provider value={value}>{children}</LiveSessionContext.Provider>;
};
