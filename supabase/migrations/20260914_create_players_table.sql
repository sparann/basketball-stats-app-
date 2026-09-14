-- Players table
-- Mirrors the table that was created in the Supabase dashboard so a fresh
-- project can be set up from the migrations folder alone. On the existing
-- project this is a no-op.

create table if not exists players (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  injured boolean default false,
  "pictureUrl" text,
  height text,
  weight text,
  created_at timestamp with time zone default now()
);

alter table players enable row level security;

create policy "Allow public read access to players" on players for select to anon using (true);
create policy "Allow public insert to players" on players for insert to anon with check (true);
create policy "Allow public update to players" on players for update to anon using (true);
create policy "Allow public delete to players" on players for delete to anon using (true);

comment on table players is 'One row per player. Standings are built from this table joined to sessions by name.';
