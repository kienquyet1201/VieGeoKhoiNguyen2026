-- VieGeo Phase 1: canonical profile data. Run once in Supabase SQL Editor.
-- Existing users data is preserved in public.users_legacy_phase1 before migration.

begin;
create extension if not exists pgcrypto;

do $$
declare
  is_canonical boolean := false;
begin
  if to_regclass('public.users') is not null then
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'users' and column_name = 'id' and data_type = 'uuid'
    ) and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'users' and column_name = 'is_premium'
    ) and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'users' and column_name = 'streak'
    ) into is_canonical;
    if not is_canonical then
      if to_regclass('public.users_legacy_phase1') is not null then
        raise exception 'Found public.users and public.users_legacy_phase1. Stop to protect legacy data.';
      end if;
      alter table public.users rename to users_legacy_phase1;
    end if;
  end if;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null default 'Người chơi',
  role text not null default 'user' check (role in ('user', 'parent', 'cs', 'admin')),
  roles text[] not null default array['user']::text[],
  is_premium boolean not null default false,
  streak integer not null default 0 check (streak >= 0),
  xp bigint not null default 0 check (xp >= 0),
  gems integer not null default 0 check (gems >= 0),
  elo integer not null default 1000 check (elo >= 0),
  streak_last_study_on date,
  last_lost_streak integer not null default 0 check (last_lost_streak >= 0),
  premium_streak_restore_month date,
  premium_streak_restores_used integer not null default 0 check (premium_streak_restores_used between 0 and 3),
  age smallint check (age between 6 and 100),
  school_grade smallint check (school_grade between 1 and 12),
  gender text,
  phone text,
  textbook_curriculum text not null default 'Chương trình GDPT 2018',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint users_roles_are_valid check (roles <@ array['user', 'parent', 'cs', 'admin']::text[] and cardinality(roles) > 0)
);

-- Makes a previously partly-applied Phase 1 schema complete without losing rows.
alter table public.users add column if not exists roles text[] not null default array['user']::text[];
alter table public.users add column if not exists is_premium boolean not null default false;
alter table public.users add column if not exists streak integer not null default 0;
alter table public.users add column if not exists xp bigint not null default 0;
alter table public.users add column if not exists gems integer not null default 0;
alter table public.users add column if not exists elo integer not null default 1000;
alter table public.users add column if not exists streak_last_study_on date;
alter table public.users add column if not exists last_lost_streak integer not null default 0;
alter table public.users add column if not exists premium_streak_restore_month date;
alter table public.users add column if not exists premium_streak_restores_used integer not null default 0;
alter table public.users add column if not exists age smallint;
alter table public.users add column if not exists school_grade smallint;
alter table public.users add column if not exists gender text;
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists textbook_curriculum text not null default 'Chương trình GDPT 2018';
alter table public.users add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.users_phase1_orphans (
  id uuid primary key,
  email text,
  archived_at timestamptz not null default timezone('utc', now()),
  row_data jsonb not null
);

insert into public.users_phase1_orphans (id, email, row_data)
select u.id, u.email, to_jsonb(u)
from public.users u
left join auth.users a on a.id = u.id
where a.id is null
on conflict (id) do update set email = excluded.email, archived_at = timezone('utc', now()), row_data = excluded.row_data;

delete from public.users u where not exists (select 1 from auth.users a where a.id = u.id);

create or replace function public.normalise_viegeo_roles(p_roles jsonb, p_role text default 'user')
returns text[]
language plpgsql
immutable
as $$
declare
  candidate text;
  result text[] := array[]::text[];
begin
  if jsonb_typeof(p_roles) = 'array' then
    for candidate in select jsonb_array_elements_text(p_roles) loop
      candidate := lower(trim(candidate));
      candidate := case candidate when 'student' then 'user' when 'cskh' then 'cs' when 'support' then 'cs' else candidate end;
      if candidate = any (array['user', 'parent', 'cs', 'admin']) and not candidate = any(result) then result := array_append(result, candidate); end if;
    end loop;
  elsif p_roles is not null then
    foreach candidate in array string_to_array(replace(trim(both '"' from p_roles::text), ' ', ''), ',') loop
      candidate := lower(trim(candidate));
      candidate := case candidate when 'student' then 'user' when 'cskh' then 'cs' when 'support' then 'cs' else candidate end;
      if candidate = any (array['user', 'parent', 'cs', 'admin']) and not candidate = any(result) then result := array_append(result, candidate); end if;
    end loop;
  end if;
  candidate := lower(trim(coalesce(p_role, 'user')));
  candidate := case candidate when 'student' then 'user' when 'cskh' then 'cs' when 'support' then 'cs' else candidate end;
  if candidate = any (array['user', 'parent', 'cs', 'admin']) and not candidate = any(result) then result := array_append(result, candidate); end if;
  if cardinality(result) = 0 then result := array['user']; end if;
  return result;
end;
$$;

do $$
begin
  if to_regclass('public.users_legacy_phase1') is not null then
    execute $migration$
      insert into public.users (id, email, display_name, role, roles, is_premium, streak, xp, gems, age, school_grade, gender, phone, textbook_curriculum, created_at, updated_at)
      select
        a.id,
        lower(a.email),
        coalesce(nullif(l.payload ->> 'display_name', ''), nullif(l.payload ->> 'user_name', ''), nullif(l.payload ->> 'name', ''), nullif(l.payload ->> 'full_name', ''), split_part(a.email, '@', 1)),
        case lower(coalesce(l.payload ->> 'role', l.payload ->> 'active_role', 'user')) when 'admin' then 'admin' when 'parent' then 'parent' when 'cs' then 'cs' when 'cskh' then 'cs' when 'support' then 'cs' else 'user' end,
        public.normalise_viegeo_roles(l.payload -> 'roles', coalesce(l.payload ->> 'role', l.payload ->> 'active_role', 'user')),
        (lower(coalesce(l.payload ->> 'is_premium', 'false')) in ('true', '1', 'yes') or lower(coalesce(l.payload ->> 'account_status', '')) in ('premium', 'active', 'approved')),
        greatest(0, coalesce(nullif(l.payload ->> 'streak', '')::integer, nullif(l.payload ->> 'current_streak', '')::integer, 0)),
        greatest(0, coalesce(nullif(l.payload ->> 'xp', '')::bigint, nullif(l.payload ->> 'score', '')::bigint, 0)),
        greatest(0, coalesce(nullif(l.payload ->> 'gems', '')::integer, 0)),
        case when coalesce(l.payload ->> 'age', '') ~ '^[0-9]+$' then (l.payload ->> 'age')::smallint else null end,
        case when coalesce(l.payload ->> 'school_grade', '') ~ '^[0-9]+$' then (l.payload ->> 'school_grade')::smallint else null end,
        nullif(l.payload ->> 'gender', ''), nullif(l.payload ->> 'phone', ''),
        coalesce(nullif(l.payload ->> 'textbook_curriculum', ''), 'Chương trình GDPT 2018'),
        coalesce(nullif(l.payload ->> 'created_at', '')::timestamptz, timezone('utc', now())), timezone('utc', now())
      from auth.users a
      left join lateral (
        select to_jsonb(legacy) as payload from public.users_legacy_phase1 legacy
        where lower(coalesce(to_jsonb(legacy) ->> 'email', to_jsonb(legacy) ->> 'user_email', '')) = lower(a.email)
        limit 1
      ) l on true
      on conflict (id) do update set email = excluded.email, display_name = excluded.display_name, role = excluded.role,
        roles = excluded.roles, is_premium = excluded.is_premium, streak = excluded.streak, xp = excluded.xp, gems = excluded.gems,
        updated_at = timezone('utc', now());
    $migration$;
  end if;
end;
$$;

insert into public.users (id, email, display_name)
select a.id, lower(a.email), coalesce(nullif(a.raw_user_meta_data ->> 'display_name', ''), nullif(a.raw_user_meta_data ->> 'name', ''), split_part(a.email, '@', 1))
from auth.users a where a.email is not null
on conflict (id) do update set email = excluded.email, updated_at = timezone('utc', now());

update public.users
set role = 'admin', roles = array['admin', 'cs', 'parent', 'user']::text[], is_premium = true
where lower(email) in ('kienquyet1201@gmail.com', 'admin@viegeo.local');

create table if not exists public.lesson_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_key text not null,
  province text,
  island text,
  topic text,
  stars smallint not null check (stars between 0 and 3),
  correct_count smallint not null check (correct_count >= 0),
  total_count smallint not null check (total_count > 0),
  reward_xp integer not null default 0 check (reward_xp >= 0),
  reward_gems integer not null default 0 check (reward_gems >= 0),
  completed_at timestamptz not null default timezone('utc', now()),
  unique (user_id, lesson_key)
);

create table if not exists public.arena_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  match_id text not null,
  elo_delta integer not null,
  xp_reward integer not null check (xp_reward >= 0),
  gems_reward integer not null check (gems_reward >= 0),
  awarded_at timestamptz not null default timezone('utc', now()),
  unique (user_id, match_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.users'::regclass and contype = 'f' and confrelid = 'auth.users'::regclass
  ) then
    alter table public.users add constraint users_id_auth_fkey foreign key (id) references auth.users(id) on delete cascade;
  end if;
end;
$$;

create index if not exists lesson_completions_user_completed_idx on public.lesson_completions (user_id, completed_at desc);
create index if not exists users_leaderboard_idx on public.users (xp desc, streak desc);

create or replace function public.set_viegeo_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists users_set_viegeo_updated_at on public.users;
create trigger users_set_viegeo_updated_at before update on public.users for each row execute function public.set_viegeo_updated_at();

create or replace function public.create_viegeo_profile_for_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, age, school_grade, gender)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    case when coalesce(new.raw_user_meta_data ->> 'age', '') ~ '^[0-9]+$' then (new.raw_user_meta_data ->> 'age')::smallint else null end,
    case when coalesce(new.raw_user_meta_data ->> 'school_grade', '') ~ '^[0-9]+$' then (new.raw_user_meta_data ->> 'school_grade')::smallint else null end,
    nullif(new.raw_user_meta_data ->> 'gender', '')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_viegeo on auth.users;
create trigger on_auth_user_created_viegeo after insert on auth.users for each row execute function public.create_viegeo_profile_for_auth_user();

create or replace function public.ensure_own_user_profile()
returns public.users
language plpgsql
security definer set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  auth_email text;
  profile public.users;
begin
  if caller_id is null then raise exception 'AUTH_REQUIRED' using errcode = '28000'; end if;
  select lower(email) into auth_email from auth.users where id = caller_id;
  if auth_email is null then raise exception 'AUTH_USER_NOT_FOUND' using errcode = 'P0001'; end if;
  insert into public.users (id, email, display_name)
  values (caller_id, auth_email, split_part(auth_email, '@', 1))
  on conflict (id) do update set email = excluded.email
  returning * into profile;
  return profile;
end;
$$;

create or replace function public.refresh_own_streak()
returns public.users
language plpgsql
security definer set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  today_vn date := (timezone('Asia/Ho_Chi_Minh', now()))::date;
  profile public.users;
begin
  if caller_id is null then raise exception 'AUTH_REQUIRED' using errcode = '28000'; end if;
  update public.users
  set last_lost_streak = case when streak_last_study_on < today_vn - 1 then streak else last_lost_streak end,
      streak = case when streak_last_study_on < today_vn - 1 then 0 else streak end
  where id = caller_id returning * into profile;
  return profile;
end;
$$;

create or replace function public.complete_lesson(
  p_lesson_key text,
  p_province text,
  p_island text,
  p_topic text,
  p_stars smallint,
  p_correct_count smallint,
  p_total_count smallint
)
returns table (rewarded boolean, xp bigint, gems integer, streak integer, xp_reward integer, gems_reward integer)
language plpgsql
security definer set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  today_vn date := (timezone('Asia/Ho_Chi_Minh', now()))::date;
  profile public.users;
  inserted_id uuid;
  next_streak integer;
  earned_xp integer := greatest(0, least(3, coalesce(p_stars, 0))) * 20;
  earned_gems integer := greatest(0, least(3, coalesce(p_stars, 0))) * 10;
begin
  if caller_id is null then raise exception 'AUTH_REQUIRED' using errcode = '28000'; end if;
  if nullif(trim(coalesce(p_lesson_key, '')), '') is null then raise exception 'LESSON_KEY_REQUIRED' using errcode = '22023'; end if;
  if p_stars not between 0 and 3 or p_total_count is null or p_total_count < 1 or p_correct_count is null or p_correct_count < 0 or p_correct_count > p_total_count then
    raise exception 'INVALID_LESSON_RESULT' using errcode = '22023';
  end if;

  insert into public.lesson_completions (user_id, lesson_key, province, island, topic, stars, correct_count, total_count, reward_xp, reward_gems)
  values (caller_id, trim(p_lesson_key), nullif(trim(p_province), ''), nullif(trim(p_island), ''), nullif(trim(p_topic), ''), p_stars, p_correct_count, p_total_count, earned_xp, earned_gems)
  on conflict (user_id, lesson_key) do nothing returning id into inserted_id;

  select * into profile from public.users where id = caller_id for update;
  if profile.id is null then raise exception 'PROFILE_REQUIRED' using errcode = 'P0001'; end if;
  if inserted_id is null then
    return query select false, profile.xp, profile.gems, profile.streak, 0, 0;
    return;
  end if;

  next_streak := profile.streak;
  if p_stars >= 2 and profile.streak_last_study_on is distinct from today_vn then
    if profile.streak_last_study_on = today_vn - 1 then next_streak := profile.streak + 1;
    elsif profile.streak_last_study_on is null then next_streak := greatest(1, profile.streak + 1);
    else next_streak := 1;
    end if;
  end if;

  update public.users
  set xp = profile.xp + earned_xp,
      gems = profile.gems + earned_gems,
      streak = next_streak,
      streak_last_study_on = case when p_stars >= 2 then today_vn else profile.streak_last_study_on end
  where id = caller_id
  returning public.users.xp, public.users.gems, public.users.streak into xp, gems, streak;

  rewarded := true;
  xp_reward := earned_xp;
  gems_reward := earned_gems;
  return next;
end;
$$;

create or replace function public.restore_own_premium_streak()
returns table (streak integer, restores_used integer, restores_remaining integer)
language plpgsql
security definer set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  month_start date := date_trunc('month', timezone('Asia/Ho_Chi_Minh', now()))::date;
  today_vn date := (timezone('Asia/Ho_Chi_Minh', now()))::date;
  profile public.users;
  next_used integer;
begin
  if caller_id is null then raise exception 'AUTH_REQUIRED' using errcode = '28000'; end if;
  select * into profile from public.users where id = caller_id for update;
  if profile.id is null then raise exception 'PROFILE_REQUIRED' using errcode = 'P0001'; end if;
  if not profile.is_premium then raise exception 'PREMIUM_REQUIRED' using errcode = 'P0001'; end if;
  if profile.streak > 0 or profile.last_lost_streak < 1 then raise exception 'NO_LOST_STREAK' using errcode = 'P0001'; end if;
  next_used := case when profile.premium_streak_restore_month = month_start then profile.premium_streak_restores_used else 0 end;
  if next_used >= 3 then raise exception 'MONTHLY_RESTORE_LIMIT_REACHED' using errcode = 'P0001'; end if;

  update public.users
  set streak = profile.last_lost_streak,
      streak_last_study_on = today_vn,
      last_lost_streak = 0,
      premium_streak_restore_month = month_start,
      premium_streak_restores_used = next_used + 1
  where id = caller_id
  returning public.users.streak, public.users.premium_streak_restores_used into streak, restores_used;
  restores_remaining := 3 - restores_used;
  return next;
end;
$$;

create or replace function public.spend_own_gems(p_cost integer)
returns public.users
language plpgsql
security definer set search_path = public, auth
as $$
declare profile public.users;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode = '28000'; end if;
  if p_cost is null or p_cost < 1 then raise exception 'INVALID_GEM_COST' using errcode = '22023'; end if;
  select * into profile from public.users where id = auth.uid() for update;
  if profile.id is null then raise exception 'PROFILE_REQUIRED' using errcode = 'P0001'; end if;
  if profile.gems < p_cost then raise exception 'INSUFFICIENT_GEMS' using errcode = 'P0001'; end if;
  update public.users set gems = profile.gems - p_cost where id = auth.uid() returning * into profile;
  return profile;
end;
$$;

create or replace function public.apply_arena_match_reward(
  p_match_id text,
  p_elo_delta integer,
  p_gems_reward integer,
  p_xp_reward integer
)
returns table (elo integer, gems integer, xp bigint, gem_delta integer, xp_delta integer)
language plpgsql
security definer set search_path = public, auth
as $$
declare
  caller_id uuid := auth.uid();
  profile public.users;
  reward_id uuid;
begin
  if caller_id is null then raise exception 'AUTH_REQUIRED' using errcode = '28000'; end if;
  if nullif(trim(coalesce(p_match_id, '')), '') is null then raise exception 'MATCH_ID_REQUIRED' using errcode = '22023'; end if;
  if p_elo_delta is null or p_elo_delta not between -100 and 100
     or p_gems_reward is null or p_gems_reward not between 0 and 100
     or p_xp_reward is null or p_xp_reward not between 0 and 100 then
    raise exception 'INVALID_ARENA_REWARD' using errcode = '22023';
  end if;
  insert into public.arena_rewards (user_id, match_id, elo_delta, gems_reward, xp_reward)
  values (caller_id, trim(p_match_id), p_elo_delta, p_gems_reward, p_xp_reward)
  on conflict (user_id, match_id) do nothing returning id into reward_id;
  select * into profile from public.users where id = caller_id for update;
  if profile.id is null then raise exception 'PROFILE_REQUIRED' using errcode = 'P0001'; end if;
  if reward_id is null then
    return query select profile.elo, profile.gems, profile.xp, 0, 0;
    return;
  end if;
  update public.users
  set elo = greatest(0, profile.elo + p_elo_delta),
      gems = profile.gems + p_gems_reward,
      xp = profile.xp + p_xp_reward
  where id = caller_id
  returning public.users.elo, public.users.gems, public.users.xp into elo, gems, xp;
  gem_delta := p_gems_reward;
  xp_delta := p_xp_reward;
  return next;
end;
$$;

create or replace function public.update_own_profile(
  p_display_name text,
  p_age smallint default null,
  p_school_grade smallint default null,
  p_gender text default null,
  p_phone text default null
)
returns public.users
language plpgsql
security definer set search_path = public, auth
as $$
declare profile public.users;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode = '28000'; end if;
  if nullif(trim(coalesce(p_display_name, '')), '') is null then raise exception 'DISPLAY_NAME_REQUIRED' using errcode = '22023'; end if;
  update public.users
  set display_name = left(trim(p_display_name), 120), age = p_age, school_grade = p_school_grade,
      gender = nullif(trim(p_gender), ''), phone = nullif(trim(p_phone), '')
  where id = auth.uid() returning * into profile;
  return profile;
end;
$$;

create or replace function public.get_leaderboard(p_limit integer default 100)
returns table (id uuid, display_name text, xp bigint, streak integer, is_premium boolean)
language plpgsql
security definer set search_path = public, auth
as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode = '28000'; end if;
  return query
    select u.id, u.display_name, u.xp, u.streak, u.is_premium
    from public.users u
    order by u.xp desc, u.streak desc, u.display_name asc
    limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;

alter table public.users enable row level security;
alter table public.lesson_completions enable row level security;
alter table public.arena_rewards enable row level security;
drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users for select to authenticated using (id = auth.uid());
drop policy if exists lesson_completions_select_self on public.lesson_completions;
create policy lesson_completions_select_self on public.lesson_completions for select to authenticated using (user_id = auth.uid());
drop policy if exists arena_rewards_select_self on public.arena_rewards;
create policy arena_rewards_select_self on public.arena_rewards for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.users from anon, authenticated;
revoke insert, update, delete on public.lesson_completions from anon, authenticated;
revoke insert, update, delete on public.arena_rewards from anon, authenticated;
grant select on public.users, public.lesson_completions, public.arena_rewards to authenticated;
grant execute on function public.ensure_own_user_profile() to authenticated;
grant execute on function public.refresh_own_streak() to authenticated;
grant execute on function public.complete_lesson(text, text, text, text, smallint, smallint, smallint) to authenticated;
grant execute on function public.restore_own_premium_streak() to authenticated;
grant execute on function public.spend_own_gems(integer) to authenticated;
grant execute on function public.apply_arena_match_reward(text, integer, integer, integer) to authenticated;
grant execute on function public.get_leaderboard(integer) to authenticated;
grant execute on function public.update_own_profile(text, smallint, smallint, text, text) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.users;
exception when duplicate_object then null;
end;
$$;

commit;
