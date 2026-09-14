import { useState } from 'react';
import { useLiveSession } from './LiveSessionContext';
import { useUI } from '../../context/ui-context';
import { isGuest } from '../../utils/guests';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';

/** Tap a guest: give them a name if you caught it, or make them a regular. Both optional. */
const GuestSheet = ({ name, onClose }) => {
  const { roster, actions } = useLiveSession();
  const { toast } = useUI();
  const [newName, setNewName] = useState('');
  const [promote, setPromote] = useState(false);
  const [busy, setBusy] = useState(false);

  const trimmed = newName.trim();
  const clash = trimmed && roster.some((r) => r !== name && r.toLowerCase() === trimmed.toLowerCase());

  const save = async () => {
    if (!trimmed) {
      onClose();
      return;
    }
    if (clash) {
      toast(`${trimmed} is already in this session`, { type: 'error' });
      return;
    }
    if (promote && isGuest(trimmed)) {
      toast('A regular needs a real name', { type: 'error' });
      return;
    }
    setBusy(true);
    try {
      await actions.renamePlayer(name, trimmed, { promote });
      toast(promote ? `${trimmed} is in the group now` : `${name} is ${trimmed} tonight`);
      onClose();
    } catch (error) {
      toast(`Couldn't rename: ${error.message}`, { type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={busy ? undefined : onClose} title={name}>
      <p className="text-[13px] text-ink-2 -mt-1 mb-4">
        Guests stay out of the standings. If you caught their name, add it. If not, leave it.
      </p>

      <input
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Their name, if you know it"
        disabled={busy}
        className="w-full h-12 px-4 rounded-xl bg-court border border-line text-[15px] font-medium text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
      />

      <label className={`flex items-start gap-3 mt-4 ${trimmed ? '' : 'opacity-50'}`}>
        <input
          type="checkbox"
          checked={promote}
          disabled={!trimmed || busy}
          onChange={(e) => setPromote(e.target.checked)}
          className="mt-0.5 w-5 h-5 accent-accent"
        />
        <span>
          <span className="block text-[15px] font-semibold text-ink">Make {trimmed || 'them'} a regular</span>
          <span className="block text-xs text-ink-2 mt-0.5">They get a profile and count in the standings from tonight on.</span>
        </span>
      </label>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <Button variant="secondary" size="lg" onClick={onClose} disabled={busy}>
          Keep as guest
        </Button>
        <Button variant="primary" size="lg" onClick={save} disabled={busy || !trimmed}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </Sheet>
  );
};

export default GuestSheet;
