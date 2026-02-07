-- Legacy Sessions Table
-- This table stores aggregated session data after live sessions are completed
-- It's the original format that the app was built around

create table if not exists sessions (
  id uuid default gen_random_uuid() primary key,
  date date not null unique,
  location text,
  players jsonb not null default '[]'::jsonb,
  total_games integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists idx_sessions_date on sessions(date);
create index if not exists idx_sessions_location on sessions(location);

-- Enable Row Level Security
alter table sessions enable row level security;

-- Public access policies (adjust for your security needs)
create policy "Allow public read access to sessions" on sessions for select to anon using (true);
create policy "Allow public insert to sessions" on sessions for insert to anon with check (true);
create policy "Allow public update to sessions" on sessions for update to anon using (true);
create policy "Allow public delete to sessions" on sessions for delete to anon using (true);

-- Comments for documentation
comment on table sessions is 'Legacy aggregated session data - stores final stats after live sessions are completed';
comment on column sessions.players is 'JSONB array of player objects with name, gamesPlayed, gamesWon, and notes';
