import { useState, useEffect } from 'react';
import Header from './components/Header';
import PlayerSummary from './components/PlayerSummary';
import SessionLog from './components/SessionLog';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import { aggregatePlayerStats } from './utils/calculations';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import statsData from './data/stats.json';

function App() {
  const [currentView, setCurrentView] = useState('summary');
  const [playerStats, setPlayerStats] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [injuredPlayers, setInjuredPlayers] = useState(() => {
    // Load injured players from localStorage
    const stored = localStorage.getItem('injuredPlayers');
    return stored ? JSON.parse(stored) : {};
  });
  const [playerPictures, setPlayerPictures] = useState(() => {
    // Load player pictures from localStorage
    const stored = localStorage.getItem('playerPictures');
    return stored ? JSON.parse(stored) : {};
  });
  const [playerDetails, setPlayerDetails] = useState(() => {
    // Load player height/weight from localStorage
    const stored = localStorage.getItem('playerDetails');
    return stored ? JSON.parse(stored) : {};
  });
  const [locations, setLocations] = useState(() => {
    // Load locations from localStorage
    const stored = localStorage.getItem('locations');
    return stored ? JSON.parse(stored) : [];
  });

  const loadData = async () => {
    setIsLoading(true);

    try {
      if (isSupabaseConfigured()) {
        // Fetch both players and sessions from Supabase
        const [playersResult, sessionsResult] = await Promise.all([
          supabase.from('players').select('*').order('name', { ascending: true }),
          supabase.from('sessions').select('*').order('date', { ascending: true })
        ]);

        if (playersResult.error) throw playersResult.error;
        if (sessionsResult.error) throw sessionsResult.error;

        const sessionsData = sessionsResult.data || [];
        const playersData = playersResult.data || [];

        setSessions(sessionsData);

        // Calculate stats from sessions
        const sessionStats = aggregatePlayerStats(sessionsData);
        const sessionStatsMap = {};
        sessionStats.forEach(player => {
          sessionStatsMap[player.name] = player;
        });

        // Merge players table with session stats
        const allPlayers = playersData.map(player => {
          const stats = sessionStatsMap[player.name] || {
            totalGamesPlayed: 0,
            totalGamesWon: 0,
            sessionsAttended: 0,
            overallWinPercentage: 0,
            lastPlayed: null,
            sessions: []
          };

          return {
            name: player.name,
            ...stats,
            injured: injuredPlayers[player.name] || false,
            pictureUrl: playerPictures[player.name] || '',
            height: playerDetails[player.name]?.height || '',
            weight: playerDetails[player.name]?.weight || ''
          };
        });

        setPlayerStats(allPlayers);
      } else {
        // Use local JSON data (for development)
        setSessions(statsData.sessions);
        const aggregated = aggregatePlayerStats(statsData.sessions);
        const withExtras = aggregated.map(player => ({
          ...player,
          injured: injuredPlayers[player.name] || false,
          pictureUrl: playerPictures[player.name] || '',
          height: playerDetails[player.name]?.height || '',
          weight: playerDetails[player.name]?.weight || ''
        }));
        setPlayerStats(withExtras);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to local data on error
      setSessions(statsData.sessions);
      const aggregated = aggregatePlayerStats(statsData.sessions);
      const withExtras = aggregated.map(player => ({
        ...player,
        injured: injuredPlayers[player.name] || false,
        pictureUrl: playerPictures[player.name] || '',
        height: playerDetails[player.name]?.height || '',
        weight: playerDetails[player.name]?.weight || ''
      }));
      setPlayerStats(withExtras);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [injuredPlayers, playerPictures, playerDetails]);

  const handleLogin = () => {
    setIsAdmin(true);
    setCurrentView('admin');
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setCurrentView('summary');
  };

  const handleSessionAdded = () => {
    // Reload data after adding a session
    loadData();
    setCurrentView('summary');
  };

  const handleUpdatePlayer = (updatedPlayer) => {
    // Update injured status in localStorage
    const newInjuredPlayers = {
      ...injuredPlayers,
      [updatedPlayer.name]: updatedPlayer.injured
    };
    setInjuredPlayers(newInjuredPlayers);
    localStorage.setItem('injuredPlayers', JSON.stringify(newInjuredPlayers));

    // Update picture URL in localStorage
    const newPlayerPictures = {
      ...playerPictures,
      [updatedPlayer.name]: updatedPlayer.pictureUrl || ''
    };
    setPlayerPictures(newPlayerPictures);
    localStorage.setItem('playerPictures', JSON.stringify(newPlayerPictures));

    // Update height/weight in localStorage
    const newPlayerDetails = {
      ...playerDetails,
      [updatedPlayer.name]: {
        height: updatedPlayer.height || '',
        weight: updatedPlayer.weight || ''
      }
    };
    setPlayerDetails(newPlayerDetails);
    localStorage.setItem('playerDetails', JSON.stringify(newPlayerDetails));

    // Check if player exists or is new
    const playerExists = playerStats.some(player => player.name === updatedPlayer.name);

    if (playerExists) {
      // Update existing player stats state
      setPlayerStats(prevStats =>
        prevStats.map(player =>
          player.name === updatedPlayer.name
            ? {
                ...player,
                injured: updatedPlayer.injured,
                pictureUrl: updatedPlayer.pictureUrl,
                height: updatedPlayer.height || '',
                weight: updatedPlayer.weight || ''
              }
            : player
        )
      );
    } else {
      // Add new player to stats
      setPlayerStats(prevStats => [...prevStats, updatedPlayer]);
    }
  };

  const handleAddLocation = (location) => {
    const newLocations = [...locations, location];
    setLocations(newLocations);
    localStorage.setItem('locations', JSON.stringify(newLocations));
  };

  const handleEditLocation = (oldLocation, newLocation) => {
    const newLocations = locations.map(loc => loc === oldLocation ? newLocation : loc);
    setLocations(newLocations);
    localStorage.setItem('locations', JSON.stringify(newLocations));

    // Update sessions that use the old location
    const updatedSessions = sessions.map(session => ({
      ...session,
      location: session.location === oldLocation ? newLocation : session.location
    }));
    setSessions(updatedSessions);
  };

  const handleRemoveLocation = (location) => {
    const newLocations = locations.filter(loc => loc !== location);
    setLocations(newLocations);
    localStorage.setItem('locations', JSON.stringify(newLocations));
  };

  const handleDeletePlayer = async (playerName) => {
    try {
      if (isSupabaseConfigured()) {
        // Delete from players table
        const { error: playerError } = await supabase
          .from('players')
          .delete()
          .eq('name', playerName);

        if (playerError) throw playerError;

        // Get all sessions and remove this player from them
        const { data: allSessions, error: fetchError } = await supabase
          .from('sessions')
          .select('*');

        if (fetchError) throw fetchError;

        // Update each session to remove this player
        for (const session of allSessions) {
          const updatedPlayers = session.players.filter(p => p.name !== playerName);

          // Only update if there are remaining players, otherwise delete the session
          if (updatedPlayers.length > 0) {
            const { error: updateError } = await supabase
              .from('sessions')
              .update({ players: updatedPlayers })
              .eq('date', session.date);

            if (updateError) throw updateError;
          } else {
            // Delete session if no players remain
            const { error: deleteError } = await supabase
              .from('sessions')
              .delete()
              .eq('date', session.date);

            if (deleteError) throw deleteError;
          }
        }
      }

      // Clean up localStorage
      const newInjuredPlayers = { ...injuredPlayers };
      delete newInjuredPlayers[playerName];
      setInjuredPlayers(newInjuredPlayers);
      localStorage.setItem('injuredPlayers', JSON.stringify(newInjuredPlayers));

      const newPlayerPictures = { ...playerPictures };
      delete newPlayerPictures[playerName];
      setPlayerPictures(newPlayerPictures);
      localStorage.setItem('playerPictures', JSON.stringify(newPlayerPictures));

      const newPlayerDetails = { ...playerDetails };
      delete newPlayerDetails[playerName];
      setPlayerDetails(newPlayerDetails);
      localStorage.setItem('playerDetails', JSON.stringify(newPlayerDetails));

      // Reload all data
      await loadData();
    } catch (error) {
      console.error('Error deleting player:', error);
      alert(`Failed to delete player: ${error.message}`);
    }
  };

  const handleDeleteSession = async (sessionDate) => {
    // Reload data from Supabase to get updated list
    await loadData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-lg font-semibold text-slate-700">Loading basketball stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        isAdmin={isAdmin}
      />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        {currentView === 'summary' && (
          <PlayerSummary
            players={playerStats}
            onUpdatePlayer={handleUpdatePlayer}
            sessions={sessions}
          />
        )}
        {currentView === 'sessions' && <SessionLog sessions={sessions} />}
        {currentView === 'admin' && !isAdmin && <AdminLogin onLogin={handleLogin} />}
        {currentView === 'admin' && isAdmin && (
          <AdminPanel
            onLogout={handleLogout}
            onSessionAdded={handleSessionAdded}
            playerStats={playerStats}
            onUpdatePlayer={handleUpdatePlayer}
            onDeletePlayer={handleDeletePlayer}
            sessions={sessions}
            locations={locations}
            onAddLocation={handleAddLocation}
            onEditLocation={handleEditLocation}
            onRemoveLocation={handleRemoveLocation}
            onDeleteSession={handleDeleteSession}
          />
        )}
      </main>

      <footer className="bg-white border-t-2 border-slate-200 py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm font-semibold text-slate-600">
            Powered by: Wyatt's Jumpshot <span className="text-white select-text">Admin Password: treysucks</span>
          </p>
          <p className="text-sm font-semibold text-slate-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
