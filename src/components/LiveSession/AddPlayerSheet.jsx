import { useEffect, useState } from 'react';
import { useLiveSession } from './LiveSessionContext';
import { useData } from '../../context/data-context';
import { useUI } from '../../context/ui-context';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { isGuest, nextGuestName } from '../../utils/guests';

/** Add a late arrival: pick an existing player or type a new name. */
const AddPlayerSheet = ({ open, onClose }) => {
  const { roster, actions } = useLiveSession();
  const { players } = useData();
  const { toast } = useUI();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const inSession = new Set(roster);
  const q = query.trim().toLowerCase();
  const available = players
    .map((p) => p.name)
    .filter((name) => !isGuest(name) && !inSession.has(name))
    .filter((name) => name.toLowerCase().includes(q));
  const exactAvailable = available.some((name) => name.toLowerCase() === q);
  const alreadyHere = roster.some((name) => name.toLowerCase() === q);

  const add = async (name, options = {}) => {
    setBusy(true);
    try {
      await actions.addPlayer(name, options);
      toast(`${name} added to the bench`);
      onClose();
    } catch (error) {
      toast(`Couldn't add ${name}: ${error.message}`, { type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add a player">
      <Button variant="secondary" size="lg" className="w-full justify-start mb-3" onClick={() => add(nextGuestName(roster), { guest: true })} disabled={busy}>
        <Icon name="plus" /> Add a guest, no name needed
      </Button>
      <div className="eyebrow mb-2">Or someone from the group</div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search, or type a new name"
        autoFocus
        disabled={busy}
        className="w-full h-12 px-4 rounded-xl bg-court border border-line text-[15px] font-medium text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
      />

      <div className="mt-3 max-h-[40vh] overflow-y-auto rounded-xl">
        {available.slice(0, 30).map((name) => {
          const full = players.find((p) => p.name === name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => add(name)}
              disabled={busy}
              className="tap w-full h-12 px-2 flex items-center gap-3 border-t border-line first:border-t-0 text-left"
            >
              <Avatar name={name} pictureUrl={full?.pictureUrl} size={32} />
              <span className="flex-1 text-[15px] font-semibold text-ink truncate">{name}</span>
              {full?.injured && <span className="text-[10px] font-bold tracking-[0.08em] text-danger">INJ</span>}
            </button>
          );
        })}
      </div>

      {alreadyHere && <p className="mt-3 text-sm text-ink-2 text-center">{query.trim()} is already in this session.</p>}

      {q && !exactAvailable && !alreadyHere && (
        <Button variant="primary" size="lg" className="w-full mt-3" onClick={() => add(query.trim())} disabled={busy}>
          {busy ? 'Adding…' : `Add "${query.trim()}" as a new player`}
        </Button>
      )}

      <p className="mt-3 text-xs text-ink-3">Everyone lands on the bench and can rotate in for the next game. Guests stay out of the standings.</p>
    </Sheet>
  );
};

export default AddPlayerSheet;
