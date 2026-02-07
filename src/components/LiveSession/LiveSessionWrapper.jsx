import { useEffect, useState } from 'react';
import { useLiveSession } from './LiveSessionContext';
import LiveSessionInterface from './LiveSessionInterface';

const LiveSessionWrapper = ({ sessionId, onExit }) => {
  const { session, actions } = useLiveSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSession = async () => {
      if (sessionId && !session) {
        try {
          await actions.resumeSession(sessionId);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [sessionId, session, actions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <p className="text-slate-900 font-bold text-lg mb-2">Error Loading Session</p>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={onExit}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <LiveSessionInterface onExit={onExit} />;
};

export default LiveSessionWrapper;
