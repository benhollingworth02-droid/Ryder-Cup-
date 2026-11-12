-- General Golf Scorer — Supabase Schema (Phase 4)
-- Run in the Supabase SQL Editor. Drops and recreates all tables.

drop table if exists public.scores        cascade;
drop table if exists public.round_players cascade;
drop table if exists public.rounds        cascade;
drop table if exists public.courses       cascade;
drop table if exists public.players       cascade;

-- Players
create table public.players (
  id         uuid         primary key default gen_random_uuid(),
  name       text         not null,
  handicap   numeric(4,1) not null default 0,
  created_at timestamptz  default now()
);

-- Course library (par + stroke index per hole stored as jsonb array)
-- holes format: [{number: 1, par: 4, stroke_index: 7}, ...]
create table public.courses (
  id          uuid     primary key default gen_random_uuid(),
  name        text     not null,
  total_holes smallint not null default 18 check (total_holes in (9, 18)),
  holes       jsonb    not null default '[]',
  created_at  timestamptz default now()
);

-- Rounds (format: stroke | stableford | match_1v1 | fourballs | ryder_cup | team_stroke | scramble)
create table public.rounds (
  id         uuid     primary key default gen_random_uuid(),
  course_id  uuid     references public.courses(id) on delete set null,
  date       date     not null,
  format     text     not null default 'stroke'
                      check (format in ('stroke','stableford','match_1v1','fourballs','ryder_cup','team_stroke','scramble')),
  holes      smallint not null default 18 check (holes in (9, 18)),
  team1_name text,    -- team name for ryder_cup / team_stroke formats
  team2_name text,
  created_at timestamptz default now()
);

-- Which players are in each round (with playing handicap + team + fourball group)
create table public.round_players (
  id               uuid     primary key default gen_random_uuid(),
  round_id         uuid     not null references public.rounds(id)   on delete cascade,
  player_id        uuid     not null references public.players(id)  on delete cascade,
  playing_handicap smallint not null default 0,
  team             smallint,          -- null for stroke/stableford, 1 or 2 for match/tournament formats
  group_num        smallint,          -- fourball group number (1,2,3...) for ryder_cup/team_stroke
  created_at       timestamptz default now(),
  unique(round_id, player_id)
);

-- Scores (one row per player × hole × round)
create table public.scores (
  id          uuid     primary key default gen_random_uuid(),
  round_id    uuid     not null references public.rounds(id)  on delete cascade,
  player_id   uuid     not null references public.players(id) on delete cascade,
  hole_number smallint not null check (hole_number between 1 and 18),
  strokes     smallint not null check (strokes >= 1),
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
alter table public.players       enable row level security;
alter table public.courses       enable row level security;
alter table public.rounds        enable row level security;
alter table public.round_players enable row level security;
alter table public.scores        enable row level security;

create policy "Public read"   on public.players for select using (true);
create policy "Public insert" on public.players for insert with check (true);
create policy "Public update" on public.players for update using (true);
create policy "Public delete" on public.players for delete using (true);

create policy "Public read"   on public.courses for select using (true);
create policy "Public insert" on public.courses for insert with check (true);
create policy "Public update" on public.courses for update using (true);
create policy "Public delete" on public.courses for delete using (true);

create policy "Public read"   on public.rounds for select using (true);
create policy "Public insert" on public.rounds for insert with check (true);
create policy "Public update" on public.rounds for update using (true);
create policy "Public delete" on public.rounds for delete using (true);

create policy "Public read"   on public.round_players for select using (true);
create policy "Public insert" on public.round_players for insert with check (true);
create policy "Public update" on public.round_players for update using (true);
create policy "Public delete" on public.round_players for delete using (true);

create policy "Public read"   on public.scores for select using (true);
create policy "Public insert" on public.scores for insert with check (true);
create policy "Public update" on public.scores for update using (true);
create policy "Public delete" on public.scores for delete using (true);

-- Enable Realtime for all tables
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.courses;
alter publication supabase_realtime add table public.rounds;
alter publication supabase_realtime add table public.round_players;
alter publication supabase_realtime add table public.scores;

-- ── Upgrade existing database (skip if doing a fresh install) ─────────────────
-- alter table public.rounds add column if not exists team1_name text;
-- alter table public.rounds add column if not exists team2_name text;
-- alter table public.rounds drop constraint if exists rounds_format_check;
-- alter table public.rounds add constraint rounds_format_check
--   check (format in ('stroke','stableford','match_1v1','fourballs','ryder_cup','team_stroke','scramble'));
-- alter table public.round_players add column if not exists group_num smallint;
