-- Live Session Mode - Real-Time Game Tracking Schema
-- This migration creates tables for tracking individual games within live sessions

-- Live session container
create table if not exists live_sessions (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  location text,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  started_at timestamp with time zone default now(),
  ended_at timestamp with time zone,
  created_by text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Players in live session (for quick lookups and stats tracking)
create table if not exists live_session_players (
  id uuid default gen_random_uuid() primary key,
  live_session_id uuid references live_sessions(id) on delete cascade,
  player_name text not null,
  total_games_played integer default 0,
  total_games_won integer default 0,
  created_at timestamp with time zone default now(),
  unique(live_session_id, player_name)
);

-- Individual game records within a live session
create table if not exists games (
  id uuid default gen_random_uuid() primary key,
  live_session_id uuid references live_sessions(id) on delete cascade,
  game_number integer not null,
  team_a_players jsonb not null,
  team_b_players jsonb not null,
  sitting_out_players jsonb default '[]'::jsonb,
  winning_team text check (winning_team in ('team_a', 'team_b')),
  played_at timestamp with time zone default now(),
  notes text,
  metadata jsonb default '{}'::jsonb
);

-- Indexes for performance
create index if not exists idx_live_sessions_date on live_sessions(date);
create index if not exists idx_live_sessions_status on live_sessions(status);
create index if not exists idx_games_live_session on games(live_session_id);
create index if not exists idx_games_game_number on games(live_session_id, game_number);
create index if not exists idx_live_session_players_session on live_session_players(live_session_id);

-- Enable Row Level Security
alter table live_sessions enable row level security;
alter table live_session_players enable row level security;
alter table games enable row level security;

-- Public access policies (adjust for your security needs)
-- These policies allow anonymous access for ease of use
-- Modify based on your authentication requirements
create policy "Allow public read access to live_sessions" on live_sessions for select to anon using (true);
create policy "Allow public insert to live_sessions" on live_sessions for insert to anon with check (true);
create policy "Allow public update to live_sessions" on live_sessions for update to anon using (true);
create policy "Allow public delete to live_sessions" on live_sessions for delete to anon using (true);

create policy "Allow public read access to live_session_players" on live_session_players for select to anon using (true);
create policy "Allow public insert to live_session_players" on live_session_players for insert to anon with check (true);
create policy "Allow public update to live_session_players" on live_session_players for update to anon using (true);
create policy "Allow public delete to live_session_players" on live_session_players for delete to anon using (true);

create policy "Allow public read access to games" on games for select to anon using (true);
create policy "Allow public insert to games" on games for insert to anon with check (true);
create policy "Allow public update to games" on games for update to anon using (true);
create policy "Allow public delete to games" on games for delete to anon using (true);

-- Comments for documentation
comment on table live_sessions is 'Container for live basketball sessions with real-time game tracking';
comment on table live_session_players is 'Player statistics within a live session';
comment on table games is 'Individual game records with team rosters and winners';
