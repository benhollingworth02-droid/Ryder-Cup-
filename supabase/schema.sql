-- Golf Score Tracker – Supabase Schema
-- Run this in the Supabase SQL editor

-- Rounds table: stores entire round state as JSONB
create table if not exists public.rounds (
  id              text        primary key,          -- 6-char share code e.g. "ABC123"
  data            jsonb       not null,             -- full round state blob
  admin_pin_hash  text        not null,             -- SHA-256 hash of admin PIN
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Auto-update updated_at on upsert
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger rounds_updated_at
  before update on public.rounds
  for each row execute function update_updated_at();

-- Row Level Security
alter table public.rounds enable row level security;

-- Anyone can read a round (viewers need to read it)
create policy "Public read access"
  on public.rounds for select
  using (true);

-- Anyone can create a round
create policy "Public insert access"
  on public.rounds for insert
  with check (true);

-- Anyone can update a round (PIN check is done client-side)
create policy "Public update access"
  on public.rounds for update
  using (true);

-- Enable real-time replication
alter publication supabase_realtime add table public.rounds;

-- Optional: auto-cleanup rounds older than 90 days (requires pg_cron extension)
-- select cron.schedule('cleanup-old-rounds', '0 3 * * *', $$
--   delete from public.rounds where created_at < now() - interval '90 days';
-- $$);
