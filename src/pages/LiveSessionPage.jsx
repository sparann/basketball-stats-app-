import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../context/data-context';
import { LiveSessionProvider, useLiveSession } from '../components/LiveSession/LiveSessionContext';
import { useActiveLiveSession } from '../components/LiveSession/useActiveLiveSession';
import LiveGameScreen from '../components/LiveSession/LiveGameScreen';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';

const Centered = ({ children }) => (
  <div className="fixed inset-0 z-40 bg-court flex items-center justify-center px-6 text-center">
    <div>{children}</div>
  </div>
);

const Loader = ({ sessionId, startWithEnd, onExit }) => {
  const { session, actions, isLoading } = useLiveSession();
  const active = useActiveLiveSession();
  const [error, setError] = useState(null);
  const started = useRef(false);

  const targetId = sessionId || active.session?.id;

  useEffect(() => {
    if (!targetId || session || started.current) return;
    started.current = true;
    actions.resumeSession(targetId).catch((err) => setError(err.message));
  }, [targetId, session, actions]);

  if (error) {
    return (
      <Centered>
        <p className="text-ink font-semibold mb-1">Couldn't open that session</p>
        <p className="text-ink-2 text-sm mb-5">{error}</p>
        <Button variant="secondary" onClick={onExit}><Icon name="chevronLeft" /> Back to Admin</Button>
      </Centered>
    );
  }

  if (!sessionId && !active.loading && !active.session) {
    return (
      <Centered>
        <p className="text-ink font-semibold mb-1">No live session</p>
        <p className="text-ink-2 text-sm mb-5">Start one from the Sessions tab.</p>
        <Button variant="secondary" onClick={onExit}><Icon name="chevronLeft" /> Back to Admin</Button>
      </Centered>
    );
  }

  if (!session || isLoading) {
    return (
      <Centered>
        <div className="inline-block w-10 h-10 rounded-full border-[3px] border-line-strong border-t-accent animate-spin" />
        <p className="mt-4 text-sm font-semibold text-ink-2">Opening the court</p>
      </Centered>
    );
  }

  return <LiveGameScreen onExit={onExit} startWithEnd={startWithEnd} />;
};

/** /admin/live — the courtside screen, deep-linkable so a reload lands back on it. */
const LiveSessionPage = () => {
  const { isAdmin, refresh } = useData();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  if (!isAdmin) return <Navigate to="/admin" replace />;

  const exit = () => {
    refresh();
    navigate('/admin', { replace: true });
  };

  return (
    <LiveSessionProvider>
      <Loader sessionId={params.get('session')} startWithEnd={params.get('end') === '1'} onExit={exit} />
    </LiveSessionProvider>
  );
};

export default LiveSessionPage;
