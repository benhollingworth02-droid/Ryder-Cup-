-- Golf Trip Scorer — Supabase Schema
-- Run this in the Supabase SQL Editor
-- WARNING: drops the old Bromsgrove Cup 'rounds' table and creates new schema

drop table if exists public.scores  cascade;
drop table if exists public.rounds  cascade;
drop table if exists public.players cascade;

-- Players
create table public.players (
  id         uuid         primary key default gen_random_uuid(),
  name       text         not null,
  handicap   numeric(4,1) not null default 0,
  created_at timestamptz  default now()
);

-- Rounds
create table public.rounds (
  id         uuid        primary key default gen_random_uuid(),
  date       date        not null,
  course     text        not null,
  holes      smallint    not null default 18 check (holes in (9, 18)),
  created_at timestamptz default now()
);

-- Scores (one row per player × hole × round)
create table public.scores (
  id          uuid        primary key default gen_random_uuid(),
  round_id    uuid        not null references public.rounds(id)   on delete cascade,
  player_id   uuid        not null references public.players(id)  on delete cascade,
  hole_number smallint    not null check (hole_number between 1 and 18),
  strokes     smallint    not null check (strokes >= 1),
  updated_at  timestamptz default now(),
  unique(round_id, player_id, hole_number)
);

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger scores_updated_at
  before update on public.scores
  for each row execute function update_updated_at();

-- Row Level Security (open — anyone with the anon key can read/write)
alter table public.players enable row level security;
alter table public.rounds  enable row level security;
alter table public.scores  enable row level security;

create policy "Public read"   on public.players for select using (true);
create policy "Public insert" on public.players for insert with check (true);
create policy "Public update" on public.players for update using (true);
create policy "Public delete" on public.players for delete using (true);

create policy "Public read"   on public.rounds for select using (true);
create policy "Public insert" on public.rounds for insert with check (true);
create policy "Public update" on public.rounds for update using (true);
create policy "Public delete" on public.rounds for delete using (true);

create policy "Public read"   on public.scores for select using (true);
create policy "Public insert" on public.scores for insert with check (true);
create policy "Public update" on public.scores for update using (true);
create policy "Public delete" on public.scores for delete using (true);

-- Enable Realtime for all three tables
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.rounds;
alter publication supabase_realtime add table public.scores;
