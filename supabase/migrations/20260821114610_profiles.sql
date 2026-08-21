create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  high_score integer not null default 0 check (high_score >= 0),
  lifetime_food integer not null default 0 check (lifetime_food >= 0),
  updated_at timestamptz not null default now(),
  constraint display_name_length check (char_length(display_name) between 3 and 20),
  constraint display_name_charset check (display_name ~ '^[A-Za-z0-9_]+$')
);

create unique index profiles_display_name_lower on public.profiles (lower(display_name));

alter table public.profiles enable row level security;

create policy "profiles_select_all"
  on public.profiles
  for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "profiles_update_own_name"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke update on public.profiles from authenticated, anon;
grant update (display_name, updated_at) on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen text;
  suffix integer := 0;
begin
  chosen := coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1), 'player');
  chosen := regexp_replace(chosen, '[^A-Za-z0-9_]', '', 'g');
  if char_length(chosen) < 3 then
    chosen := concat('player', substr(new.id::text, 1, 6));
  end if;
  chosen := substr(chosen, 1, 20);

  while exists (select 1 from public.profiles where lower(display_name) = lower(chosen)) loop
    suffix := suffix + 1;
    chosen := substr(concat(substr(chosen, 1, 16), suffix), 1, 20);
  end loop;

  insert into public.profiles (id, display_name)
  values (new.id, chosen);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.record_high_score(p_score integer)
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

  update public.profiles
  set
    high_score = greatest(high_score, p_score),
    updated_at = now()
  where id = auth.uid()
  returning high_score into v_score;

  if v_score is null then
    raise exception 'Profile not found';
  end if;

  return v_score;
end;
$$;

revoke all on function public.record_high_score(integer) from public, anon;
grant execute on function public.record_high_score(integer) to authenticated;

grant select on public.profiles to anon, authenticated;
grant insert on public.profiles to authenticated;
