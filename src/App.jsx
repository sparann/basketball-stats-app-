import { useState, useEffect } from 'react';
import Header from './components/Header';
import PlayerSummary from './components/PlayerSummary';
import SessionLog from './components/SessionLog';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import { aggregatePlayerStats } from './utils/calculations';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import statsData from './data/stats.json';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('summary');
  const [playerStats, setPlayerStats] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);

    try {
      if (isSupabaseConfigured()) {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .order('date', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setSessions(data);
          const aggregated = aggregatePlayerStats(data);
          setPlayerStats(aggregated);
        } else {
          // No data in Supabase, use fallback
          setSessions(statsData.sessions);
          const aggregated = aggregatePlayerStats(statsData.sessions);
          setPlayerStats(aggregated);
        }
      } else {
        // Use local JSON data (for development)
        setSessions(statsData.sessions);
        const aggregated = aggregatePlayerStats(statsData.sessions);
        setPlayerStats(aggregated);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to local data on error
      setSessions(statsData.sessions);
      const aggregated = aggregatePlayerStats(statsData.sessions);
      setPlayerStats(aggregated);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

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

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">Loading basketball stats...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        isAdmin={isAdmin}
      />

      <main className="main-content">
        {currentView === 'summary' && <PlayerSummary players={playerStats} />}
        {currentView === 'sessions' && <SessionLog sessions={sessions} />}
        {currentView === 'admin' && !isAdmin && <AdminLogin onLogin={handleLogin} />}
        {currentView === 'admin' && isAdmin && (
          <AdminPanel onLogout={handleLogout} onSessionAdded={handleSessionAdded} />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Basketball Stats Tracker • Updated {new Date().toLocaleDateString()}
        </p>
      </footer>
    </div>
  );
}

export default App;
