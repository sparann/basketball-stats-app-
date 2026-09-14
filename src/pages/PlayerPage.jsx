import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/data-context';
import { useUI } from '../context/ui-context';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { uploadPlayerPhoto } from '../lib/images';
import { computeStandings, formatDate, formatWinPercentage } from '../utils/calculations';
import Avatar from '../components/ui/Avatar';
import Icon from '../components/ui/Icon';
import Sheet from '../components/ui/Sheet';
import Button from '../components/ui/Button';
import WinBars from '../components/ui/WinBars';

const MIN_GAMES_TOGETHER = 5;
const MIN_GAMES_AT_COURT = 5;

const Tile = ({ label, value, accent = false }) => (
  <div className="bg-surface rounded-xl px-3 py-2.5">
    <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">{label}</div>
    <div className={`display text-[26px] leading-none mt-1.5 ${accent ? 'text-accent' : 'text-ink'}`}>{value}</div>
  </div>
);

const SectionLabel = ({ children, right }) => (
  <div className="flex items-center justify-between mb-2">
    <div className="eyebrow">{children}</div>
    {right && <div className="text-[11px] text-ink-3 tabular">{right}</div>}
  </div>
);

const InsightRow = ({ leading, title, value, sub }) => (
  <div className="flex items-center gap-3 h-12 bg-surface rounded-xl px-3">
    {leading}
    <div className="flex-1 text-[15px] font-semibold text-ink truncate">{title}</div>
    <div className="text-[13px] text-ink-2 tabular">
      <span className="text-ink font-semibold">{value}</span> · {sub}
    </div>
  </div>
);

const PlayerPage = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const { players, sessions, updatePlayer } = useData();
  const { toast } = useUI();

  const playerName = decodeURIComponent(name);
  const player = players.find((p) => p.name === playerName);

  const [menuOpen, setMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const fileInput = useRef(null);

  // Game-level data lives in live sessions; fetch it once per player for the teammate insight
  useEffect(() => {
    let cancelled = false;

    const fetchGames = async () => {
      if (!isSupabaseConfigured() || !player || player.sessions.length === 0) {
        setLoadingGames(false);
        return;
      }

      try {
        const dates = player.sessions.map((s) => s.date);
        const { data: liveSessions, error: liveError } = await supabase
          .from('live_sessions')
          .select('id')
          .in('date', dates)
          .eq('status', 'completed');
        if (liveError) throw liveError;

        if (!liveSessions || liveSessions.length === 0) return;

        const { data, error } = await supabase
          .from('games')
          .select('team_a_players, team_b_players, winning_team')
          .in('live_session_id', liveSessions.map((l) => l.id));
        if (error) throw error;

        if (!cancelled) setGames(data || []);
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        if (!cancelled) setLoadingGames(false);
      }
    };

    fetchGames();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerName, player?.sessionsAttended]);

  const standing = useMemo(() => {
    const { active } = computeStandings(players);
    return active.find((p) => p.name === playerName) || null;
  }, [players, playerName]);

  const bestTeammates = useMemo(() => {
    const byTeammate = {};
    for (const game of games) {
      const onA = game.team_a_players?.includes(playerName);
      const onB = game.team_b_players?.includes(playerName);
      if (!onA && !onB) continue;
      const team = onA ? 'team_a' : 'team_b';
      const teammates = (onA ? game.team_a_players : game.team_b_players).filter((n) => n !== playerName);
      for (const mate of teammates) {
        byTeammate[mate] ||= { gamesPlayed: 0, gamesWon: 0 };
        byTeammate[mate].gamesPlayed++;
        if (game.winning_team === team) byTeammate[mate].gamesWon++;
      }
    }
    return Object.entries(byTeammate)
      .filter(([, s]) => s.gamesPlayed >= MIN_GAMES_TOGETHER)
      .map(([mate, s]) => ({ name: mate, ...s, winRate: s.gamesWon / s.gamesPlayed }))
      .sort((a, b) => b.winRate - a.winRate || b.gamesPlayed - a.gamesPlayed)
      .slice(0, 2);
  }, [games, playerName]);

  const bestCourt = useMemo(() => {
    const byCourt = {};
    for (const session of sessions) {
      if (!session.location) continue;
      const me = session.players.find((p) => p.name === playerName);
      if (!me) continue;
      byCourt[session.location] ||= { gamesPlayed: 0, gamesWon: 0 };
      byCourt[session.location].gamesPlayed += me.gamesPlayed;
      byCourt[session.location].gamesWon += me.gamesWon;
    }
    return Object.entries(byCourt)
      .filter(([, s]) => s.gamesPlayed >= MIN_GAMES_AT_COURT)
      .map(([court, s]) => ({ name: court, ...s, winRate: s.gamesWon / s.gamesPlayed }))
      .sort((a, b) => b.winRate - a.winRate)[0] || null;
  }, [sessions, playerName]);

  if (!player) {
    return (
      <div className="max-w-2xl mx-auto px-5 pt-[calc(env(safe-area-inset-top)+16px)]">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <Icon name="chevronLeft" /> Standings
        </Button>
        <p className="mt-8 text-ink-2">No player named {playerName}.</p>
      </div>
    );
  }

  const losses = player.totalGamesPlayed - player.totalGamesWon;
  const recent = player.sessions.slice(-10);
  const best = player.sessions.reduce((max, s) => Math.max(max, s.winPercentage), 0);
  const lastSession = player.sessions[player.sessions.length - 1];
  const locationByDate = new Map(sessions.map((s) => [s.date, s.location]));

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file', { type: 'error' });
      return;
    }
    if (!isSupabaseConfigured()) {
      toast('Photo uploads need Supabase configured', { type: 'error' });
      return;
    }

    setUploading(true);
    try {
      const url = await uploadPlayerPhoto(supabase, file);
      const ok = await updatePlayer({ ...player, pictureUrl: url });
      if (ok) toast('Photo updated');
    } catch (error) {
      toast(error.message || 'Upload failed', { type: 'error' });
    } finally {
      setUploading(false);
      setMenuOpen(false);
    }
  };

  const toggleInjured = async () => {
    const ok = await updatePlayer({ ...player, injured: !player.injured });
    if (ok) toast(player.injured ? 'Marked healthy' : 'Marked injured');
    setMenuOpen(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="tap w-11 h-11 rounded-full bg-surface flex items-center justify-center text-ink"
        >
          <Icon name="chevronLeft" />
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="More"
          className="tap w-11 h-11 rounded-full bg-surface flex items-center justify-center text-ink"
        >
          <Icon name="more" />
        </button>
      </div>

      {/* Identity */}
      <div className="flex items-center gap-4 px-5 pt-4">
        <Avatar name={player.name} pictureUrl={player.pictureUrl} size={72} />
        <div className="min-w-0">
          <h1 className="display text-4xl leading-none text-ink font-extrabold truncate">{player.name}</h1>
          <div className="text-[13px] text-ink-2 mt-1.5">
            {[player.height, player.weight].filter(Boolean).join(' · ')}
            {(player.height || player.weight) && lastSession && ' · '}
            {lastSession && `Last played ${formatDate(lastSession.date)}`}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {standing && (
              <span className="h-[22px] px-2 rounded-full border border-line-strong text-[11px] font-bold tracking-[0.08em] text-accent flex items-center tabular">
                #{standing.rank} ACTIVE
              </span>
            )}
            {player.injured && (
              <span className="h-[22px] px-2 rounded-full bg-danger-soft text-[11px] font-bold tracking-[0.08em] text-danger flex items-center">
                INJURED
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hero stat */}
      <div className="px-5 pt-5">
        <div className="display text-[72px] leading-[0.9] tracking-tight text-ink font-extrabold">
          {formatWinPercentage(player.overallWinPercentage, player.totalGamesPlayed)}
        </div>
        <div className="eyebrow mt-1.5 tabular">Win rate · {player.totalGamesWon}–{losses}</div>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-4 gap-2 px-5 pt-5">
        <Tile label="Games" value={player.totalGamesPlayed} />
        <Tile label="Wins" value={player.totalGamesWon} />
        <Tile label="Sessions" value={player.sessionsAttended} />
        <Tile label="Best day" value={player.sessions.length ? formatWinPercentage(best, 1) : '—'} accent />
      </div>

      {/* Last sessions chart */}
      {recent.length > 0 && (
        <div className="px-5 pt-6">
          <SectionLabel right="Win rate per session">Last {recent.length} sessions</SectionLabel>
          <div className="border-b border-line pb-0">
            <WinBars sessions={recent} slots={recent.length} height={72} gap={5} />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[11px] tabular">
            <span className="text-ink-3">{formatDate(recent[0].date)}</span>
            <span className="text-accent">
              {formatDate(lastSession.date)} · {lastSession.gamesWon}–{lastSession.gamesPlayed - lastSession.gamesWon}
            </span>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="px-5 pt-6 space-y-4">
        <div>
          <SectionLabel>Plays best with</SectionLabel>
          {loadingGames ? (
            <div className="h-12 rounded-xl bg-surface animate-pulse" />
          ) : bestTeammates.length > 0 ? (
            <div className="space-y-2">
              {bestTeammates.map((mate) => (
                <InsightRow
                  key={mate.name}
                  leading={<Avatar name={mate.name} pictureUrl={players.find((p) => p.name === mate.name)?.pictureUrl} size={32} />}
                  title={mate.name}
                  value={formatWinPercentage(mate.winRate, mate.gamesPlayed)}
                  sub={`${mate.gamesPlayed} games`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-3">
              {games.length === 0
                ? 'Needs live-session games to work out.'
                : `Needs ${MIN_GAMES_TOGETHER}+ games with the same teammate.`}
            </p>
          )}
        </div>

        <div>
          <SectionLabel>Best court</SectionLabel>
          {bestCourt ? (
            <InsightRow
              leading={<span className="w-8 h-8 flex items-center justify-center text-ink-2"><Icon name="pin" /></span>}
              title={bestCourt.name}
              value={formatWinPercentage(bestCourt.winRate, bestCourt.gamesPlayed)}
              sub={`${bestCourt.gamesPlayed} games`}
            />
          ) : (
            <p className="text-sm text-ink-3">Needs {MIN_GAMES_AT_COURT}+ games at one court.</p>
          )}
        </div>
      </div>

      {/* Session history */}
      <div className="px-5 pt-6">
        <SectionLabel>Sessions</SectionLabel>
        {player.sessions.slice().reverse().map((s, i) => {
          return (
            <div key={s.date + i} className="flex items-center gap-3 h-[52px] border-t border-line">
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-ink">{formatDate(s.date)}</div>
                <div className="text-xs text-ink-2 truncate">{locationByDate.get(s.date) || s.notes || ''}</div>
              </div>
              <div className="text-[13px] text-ink-2 tabular">{s.gamesWon}–{s.gamesPlayed - s.gamesWon}</div>
              <div className="display w-14 text-right text-xl text-ink">
                {formatWinPercentage(s.winPercentage, s.gamesPlayed)}
              </div>
            </div>
          );
        })}
        <div className="border-t border-line" />
      </div>

      {/* Actions */}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title={player.name}>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        <div className="space-y-2">
          <Button
            variant="secondary"
            size="lg"
            className="w-full justify-start"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
          >
            <Icon name="camera" /> {uploading ? 'Uploading…' : 'Change photo'}
          </Button>
          <Button variant="secondary" size="lg" className="w-full justify-start" onClick={toggleInjured}>
            <Icon name="flag" /> {player.injured ? 'Mark as healthy' : 'Mark as injured'}
          </Button>
        </div>
      </Sheet>
    </div>
  );
};

export default PlayerPage;
