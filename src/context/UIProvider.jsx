import { useCallback, useMemo, useRef, useState } from 'react';
import { UIContext } from './ui-context';
import Sheet from '../components/ui/Sheet';
import Button from '../components/ui/Button';

const TOAST_MS = 3200;

/**
 * App-wide toast and confirm sheet. Replaces window.alert / window.confirm,
 * which block, look foreign on iOS, and cannot be styled or tested.
 */
export const UIProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [pending, setPending] = useState(null);
  const nextId = useRef(0);

  const toast = useCallback((message, options = {}) => {
    const id = nextId.current++;
    const type = options.type || 'info';
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, options.duration || TOAST_MS);
  }, []);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const settle = (value) => {
    if (pending) pending.resolve(value);
    setPending(null);
  };

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <UIContext.Provider value={value}>
      {children}

      {/* Toasts sit just above the tab bar */}
      <div
        className="fixed inset-x-0 z-40 flex flex-col items-center gap-2 px-4 pointer-events-none"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 76px)' }}
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-sm w-full text-center px-4 py-3 rounded-xl text-sm font-semibold shadow-xl ${
              t.type === 'error' ? 'bg-danger text-court' : 'bg-ink text-court'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      <Sheet open={Boolean(pending)} onClose={() => settle(false)} title={pending?.title || 'Are you sure?'}>
        {pending?.message && <p className="text-ink-2 text-[15px] leading-relaxed">{pending.message}</p>}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <Button variant="secondary" size="lg" onClick={() => settle(false)}>
            {pending?.cancelLabel || 'Cancel'}
          </Button>
          <Button variant={pending?.destructive ? 'danger' : 'primary'} size="lg" onClick={() => settle(true)}>
            {pending?.confirmLabel || 'Confirm'}
          </Button>
        </div>
      </Sheet>
    </UIContext.Provider>
  );
};
