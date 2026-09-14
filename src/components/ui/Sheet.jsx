import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

/**
 * Bottom sheet on phones, centered dialog on wider screens.
 * Closes on backdrop tap and Escape. Locks page scroll while open.
 */
const Sheet = ({ open, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxWidth = size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-md';

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div
        className={`relative w-full ${maxWidth} max-h-[92vh] flex flex-col bg-surface border border-line-strong rounded-t-2xl sm:rounded-2xl shadow-2xl pb-safe`}
      >
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-line-strong" />
        </div>
        {(title || onClose) && (
          <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2">
            <h2 className="display text-2xl text-ink leading-none">{title}</h2>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="tap w-11 h-11 -mr-3 flex items-center justify-center rounded-full text-ink-2 hover:bg-surface-2"
              >
                <Icon name="x" />
              </button>
            )}
          </div>
        )}
        <div className="px-5 pb-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 pb-4 pt-3 border-t border-line">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Sheet;
