import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UIProvider } from './context/UIProvider';
import { DataProvider } from './context/DataProvider';
import { useData } from './context/data-context';
import Captcha from './components/Captcha';
import TabBar from './components/ui/TabBar';
import StandingsPage from './pages/StandingsPage';
import PlayerPage from './pages/PlayerPage';
import SessionsPage from './pages/SessionsPage';
import SessionPage from './pages/SessionPage';
import AdminPage from './pages/AdminPage';
import LiveSessionPage from './pages/LiveSessionPage';
import LivePage from './pages/LivePage';
import GuestsPage from './pages/GuestsPage';

const GATE_KEY = 'captchaCompletedTimestamp';
const GATE_TTL = 24 * 60 * 60 * 1000; // once a day

const gatePassed = () => {
  // Local development can skip the gate with VITE_DEV_SKIP_GATE=true in .env.local
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_SKIP_GATE === 'true') return true;

  localStorage.removeItem('captchaCompleted'); // pre-timestamp key, long gone
  const completedAt = parseInt(localStorage.getItem(GATE_KEY) || '', 10);
  return Number.isFinite(completedAt) && Date.now() - completedAt < GATE_TTL;
};

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block w-10 h-10 rounded-full border-[3px] border-line-strong border-t-accent animate-spin" />
      <p className="mt-4 text-sm font-semibold text-ink-2">Loading standings</p>
    </div>
  </div>
);

const Shell = () => {
  const { isLoading } = useData();

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen pb-[calc(env(safe-area-inset-bottom)+76px)]">
      <Routes>
        <Route path="/" element={<StandingsPage />} />
        <Route path="/players/:name" element={<PlayerPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/sessions/:key" element={<SessionPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/live" element={<LiveSessionPage />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/guests" element={<GuestsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <TabBar />
    </div>
  );
};

function App() {
  const [passed, setPassed] = useState(gatePassed);

  if (!passed) {
    return (
      <Captcha
        onSuccess={() => {
          localStorage.setItem(GATE_KEY, Date.now().toString());
          setPassed(true);
        }}
      />
    );
  }

  return (
    <BrowserRouter>
      <UIProvider>
        <DataProvider>
          <Shell />
        </DataProvider>
      </UIProvider>
    </BrowserRouter>
  );
}

export default App;
