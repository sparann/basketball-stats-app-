-- Fix sessions table to allow multiple sessions per day
-- Remove unique constraint on date and add live_session_id for proper referencing

-- Drop the unique constraint on date
alter table sessions drop constraint if exists sessions_date_key;

-- Add live_session_id column to link back to the live session
alter table sessions add column if not exists live_session_id uuid references live_sessions(id) on delete cascade;

-- Create index on live_session_id for better query performance
create index if not exists idx_sessions_live_session_id on sessions(live_session_id);

-- Comment for documentation
comment on column sessions.live_session_id is 'Reference to the live session that generated this aggregated session data';
