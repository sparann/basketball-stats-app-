# Wyatt's Win Tracker

Standings for a pickup basketball group, plus a courtside mode for recording
games as they happen. Built for phones. Live at https://sparan.vercel.app.

## What it does

- **Standings.** Every player ranked by win percentage. Players need a minimum
  number of games (40% of the group average, between 5 and 20), two sessions,
  and a game in the last 14 days to qualify. Everyone else sits in *Needs more
  games* or *Inactive*.
- **Player pages.** Win rate, last ten sessions, best teammate, best court,
  full history.
- **Sessions.** Every night played, with the MVP for each.
- **Admin.** Password-gated. Add or edit sessions by hand, manage players and
  courts, and run a **live session**: pick Light and Dark, tap the winner
  after each game, rotate the bench, end the night and it saves to the
  standings. Every stat is derived from the game rows, so recording a game is
  one write and undo is one delete.
- **Live.** `/live` shows tonight's records and results to whoever is on the
  bench. A LIVE badge appears on Standings while a session is running.

## Stack

Vite, React 19, React Router, Tailwind 3, Supabase (Postgres + Storage).
No server code. Deployed on Vercel from `main`.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint
npm test           # vitest, pure functions in src/utils
npm run build
```

Without Supabase, live sessions are kept in the browser's localStorage so the
courtside screens can be exercised end to end.

Create `.env.local` (git-ignored). Either point at Supabase:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_ADMIN_PASSWORD=...
```

or work offline with sample data:

```
VITE_DEV_SKIP_GATE=true       # skip the "pick the best player" gate
VITE_DEV_SAMPLE_DATA=true     # load src/data/sample-sessions.json
```

The dev flags only apply to `npm run dev`; production builds ignore them.

## Database

Supabase tables, all with public read/write policies for the anon key
(auth is on the roadmap):

| Table | Purpose |
|---|---|
| `players` | One row per player: name, injured, pictureUrl, height, weight |
| `sessions` | One row per night: date, location, `players` jsonb with games played and won |
| `live_sessions` | A courtside session in progress or finished |
| `live_session_players` | Per-player counters inside a live session |
| `games` | Each game's rosters and winner |

Photos live in the `basketball-stats` storage bucket under `player-photos/`.

Schema lives in `supabase/migrations/`. For a fresh project, run them in
order in the Supabase SQL editor. `20260914_enable_realtime.sql` is optional:
it lets `/live` update instantly instead of every 20 seconds.

## Deploying

Vercel builds every push. `main` is production; other branches get a preview
URL. The three `VITE_` variables must be set for both Production and Preview
environments. `vercel.json` rewrites all paths to `index.html` so deep links
work.

## Project layout

```
src/
  App.jsx                 gate, providers, routes, tab bar
  context/                DataProvider (players, sessions, admin), UIProvider (toast, confirm)
  pages/                  Standings, Player, Sessions, Session, Admin, LiveSession (/admin/live), Live (/live)
  components/ui/          Icon, Avatar, Sparkline, Sheet, Button, PageHeader, TabBar
  components/             admin panel, modals, captcha gate
  components/LiveSession/ courtside: context, court screen, team setup, rotation, sheets
  lib/                    supabase client, live session store (Supabase or local), photo resize, rename helper
  utils/                  win-rate math, standings groups, dates, names
  data/                   sample fixture for local development
```

## Roadmap

- Player ids instead of names as the join key.
- Courts stored in Supabase instead of the browser.
- Supabase Auth for admins, write policies scoped to signed-in users.
- Offline queue for courtside writes when the gym has no signal.
