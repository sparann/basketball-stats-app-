import { useState, useEffect } from 'react';
import Header from './components/Header';
import PlayerSummary from './components/PlayerSummary';
import SessionLog from './components/SessionLog';
import { aggregatePlayerStats } from './utils/calculations';
import statsData from './data/stats.json';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('summary');
  const [playerStats, setPlayerStats] = useState([]);

  useEffect(() => {
    // Aggregate player stats from sessions
    const aggregated = aggregatePlayerStats(statsData.sessions);
    setPlayerStats(aggregated);
  }, []);

  return (
    <div className="app">
      <Header currentView={currentView} onViewChange={setCurrentView} />

      <main className="main-content">
        {currentView === 'summary' && <PlayerSummary players={playerStats} />}
        {currentView === 'sessions' && <SessionLog sessions={statsData.sessions} />}
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
