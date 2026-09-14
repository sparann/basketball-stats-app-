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
  courts, and run a **live session**: pick teams, tap the winner after each
  game, rotate the bench, end the night and it saves to the standings.

## Stack

Vite, React 19, React Router, Tailwind 3, Supabase (Postgres + Storage).
No server code. Deployed on Vercel from `main`.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint
npm run build
```

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
order in the Supabase SQL editor.

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
  pages/                  Standings, Player, Sessions, Session, Admin
  components/ui/          Icon, Avatar, Sparkline, Sheet, Button, PageHeader, TabBar
  components/             admin panel, modals, captcha gate
  components/LiveSession/ courtside mode
  lib/                    supabase client, photo resize, rename helper
  utils/                  win-rate math, standings groups, dates, names
  data/                   sample fixture for local development
```

## Roadmap

- Courtside redesign: Light and Dark teams, winner buttons in the thumb zone,
  one-screen rotation.
- Stats derived from `games` instead of stored counters.
- Player ids instead of names as the join key.
- Courts stored in Supabase instead of the browser.
- Supabase Auth for admins, write policies scoped to signed-in users.
- Live standings for people on the bench.
