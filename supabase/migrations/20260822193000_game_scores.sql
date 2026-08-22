create table public.games (
  id text primary key,
  title text not null,
  sort_order integer not null default 0
);

insert into public.games (id, title, sort_order) values
  ('snake', 'Snake', 1),
  ('chase', 'Chase', 2),
  ('stack', 'Stack', 3);

create table public.game_scores (
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id text not null references public.games (id) on delete restrict,
  high_score integer not null default 0 check (high_score >= 0),
  lifetime_points integer not null default 0 check (lifetime_points >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create index game_scores_leaderboard on public.game_scores (game_id, high_score desc);

insert into public.game_scores (user_id, game_id, high_score, lifetime_points, updated_at)
select id, 'snake', high_score, lifetime_food, updated_at
from public.profiles;

alter table public.game_scores enable row level security;
alter table public.games enable row level security;

create policy "games_select_all"
  on public.games
  for select
  using (true);

create policy "game_scores_select_all"
  on public.game_scores
  for select
  using (true);

revoke all on table public.games from public, anon, authenticated;
revoke all on table public.game_scores from public, anon, authenticated;
grant select on table public.games to anon, authenticated;
grant select on table public.game_scores to anon, authenticated;

create or replace function public.record_game_high_score(p_game_id text, p_score integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_score integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_score is null or p_score < 0 then
    raise exception 'Invalid score';
  end if;
  if p_game_id is null or not exists (select 1 from public.games where id = p_game_id) then
    raise exception 'Unknown game';
  end if;

  insert into public.game_scores (user_id, game_id, high_score, updated_at)
  values (auth.uid(), p_game_id, p_score, now())
  on conflict (user_id, game_id)
  do update set
    high_score = greatest(public.game_scores.high_score, excluded.high_score),
    updated_at = now()
  returning high_score into v_score;

  return v_score;
end;
$$;

create or replace function public.record_high_score(p_score integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.record_game_high_score('snake', p_score);
end;
$$;

revoke all on function public.record_game_high_score(text, integer) from public, anon;
grant execute on function public.record_game_high_score(text, integer) to authenticated;

alter table public.profiles drop column if exists high_score;
alter table public.profiles drop column if exists lifetime_food;
