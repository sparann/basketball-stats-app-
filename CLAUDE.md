# CLAUDE.md

Pickup basketball win tracker for Wyatt's friend group. Used almost only on
phones: friends check standings after a run, Wyatt runs live sessions
courtside. See README.md for setup and the data model.

## Commands

- `npm run dev` — Vite on :5173. With `.env.local` flags it runs offline on sample data.
- `npm run lint` — must stay at zero. CI runs lint, tests and build on every PR.
- `npm test` — vitest over `src/utils/*.test.js`. Add a case when you touch the math.
- `npm run build`

## Architecture

- `App.jsx` renders the gate (Captcha), then `UIProvider` > `DataProvider` > routes + `TabBar`.
- `DataProvider` owns players, sessions, locations, admin state and every
  mutation. Pages read it with `useData()`. Call `refresh()` after writing to
  Supabase outside the provider.
- `UIProvider` gives `useUI()` with `toast(message, { type })` and
  `await confirm({ title, message, confirmLabel, destructive })`.
  **Never use `window.alert` or `window.confirm`.**
- Routes: `/`, `/players/:name`, `/sessions`, `/sessions/:key`, `/admin`,
  `/admin/live` (courtside, full-screen z-40 above the tab bar, `?session=` to
  open one, `?end=1` to land on the summary), `/live` (read-only spectator),
  `/guests` (all guests added up).
- `lib/liveSessionStore.js` is the only place courtside code touches storage.
  With Supabase it uses live_sessions / live_session_players / games; without
  it, localStorage. `LiveSessionContext` derives players, records and the
  end-of-night summary from the game rows: no counters anywhere.
- Team keys stay `team_a` / `team_b` in the database; `TEAM_LABELS` maps them
  to Light / Dark for people. `TEAM_CAP` (5) lives in `utils/liveStats.js`.

## Design system

Tokens are Tailwind classes from `tailwind.config.js`:

- Ground `bg-court`, surfaces `bg-surface` / `bg-surface-2` / `bg-surface-raised`
- Hairlines `border-line`, pill borders `border-line-strong`
- Text `text-ink` / `text-ink-2` / `text-ink-3`
- One accent `accent` (rank, current game, primary action), plus `danger`
- Numerals and headings use `.display` (Barlow Condensed, tabular). Body is Barlow.
- Helper classes in `index.css`: `.eyebrow`, `.display`, `.tabular`, `.tap` (44px min)
- Icons come from `components/ui/Icon`. No emoji as icons.
- Anything a thumb hits is at least 44px tall. Bottom sheets (`Sheet`) over centered modals.

## Product rules from Wyatt

- The team-setup wizard caps each team at 5. Keep it.
- Any shortcut past the rotation screen must still offer Reshoot (switch teams).
- The captcha gate is a joke and shows once a day. Keep both.
- The hidden "Admin password" in the standings footer is intentional.
- Anyone can change a player's photo or injured flag from the player page.
  Undecided whether that should move behind admin.

## Guests

Outsiders who join a run are guests. Courtside, the Guest button adds "Guest N"
for the night with no typing; tapping a guest chip lets Wyatt name them or make
them a regular. `utils/guests.js` is the rule: anyone named "Guest …" or
"Random …" (or flagged `guest: true` in a session row) is a guest. Guests get no
players row, never appear in standings or the games-minimum average, are not
MVP-eligible, are skipped by teammate insights, and have no profile page. The
old Random 1/2/3 profiles are guests by that rule; never delete them, their
games are in real sessions. `aggregateGuests(sessions)` adds every guest line
into one unranked record: the Guests card at the bottom of Standings (same
period filter) and the `/guests` page, night by night.

## Data gotchas

- Names are the join key everywhere. Renaming goes through
  `lib/renamePlayer.js`, which rewrites sessions, live-session players and
  game rosters. Player ids are on the roadmap.
- Two sessions can share a date. Always mutate sessions by `id`, never by date.
- `live_session_players` is just the roster now. Its counter columns are
  unused and can be dropped in a later migration.
- Parse `YYYY-MM-DD` with `parseLocalDate`, never `new Date(string)`.
- Locations live in localStorage only, seeded from session rows.
- Standings are built from the `players` table, so anyone who plays must have
  a row there. The live session creates one for new names.

## Working here

- Branch off `main`, keep lint at zero, open a PR. Vercel gives each branch a
  preview URL; test courtside flows there against real Supabase before merging.
- Sample fixture: `src/data/sample-sessions.json` (names are placeholders).
