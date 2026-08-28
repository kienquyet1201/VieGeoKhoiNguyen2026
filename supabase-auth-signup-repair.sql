-- VieGeo Auth repair: run this complete file in Supabase SQL Editor.
-- The script supports public.users.id as UUID, text, or an auto-generated key.

begin;

-- Required profile fields. Existing data is preserved.
create table if not exists public.users (
    id uuid primary key,
    email text not null,
    role text not null default 'user',
    created_at timestamptz not null default now()
);

alter table public.users add column if not exists email text;
alter table public.users add column if not exists user_name text;
alter table public.users add column if not exists role text;
alter table public.users add column if not exists score integer not null default 0;
alter table public.users add column if not exists current_streak integer not null default 0;
alter table public.users add column if not exists created_at timestamptz not null default now();
alter table public.users add column if not exists updated_at timestamptz not null default now();
alter table public.users alter column role set default 'user';

update public.users
set email = lower(trim(email))
where email is not null and email <> lower(trim(email));

create index if not exists idx_viegeo_users_email_lookup on public.users (email);

-- One profile writer used by both the Auth trigger and the repair of existing
-- Auth users. It never inserts a NULL id into a table that requires one.
create or replace function public.viegeo_upsert_auth_profile(
    p_auth_id uuid,
    p_email text,
    p_metadata jsonb,
    p_created_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    profile_email text := lower(trim(p_email));
    profile_name text := coalesce(
        nullif(trim(p_metadata ->> 'user_name'), ''),
        nullif(trim(p_metadata ->> 'name'), ''),
        nullif(trim(p_metadata ->> 'full_name'), ''),
        split_part(lower(trim(p_email)), '@', 1),
        'Học viên'
    );
    id_data_type text;
    id_udt_name text;
    id_default text;
    id_is_identity text;
begin
    if profile_email is null or profile_email = '' then
        raise exception 'VieGeo signup requires a valid email';
    end if;

    update public.users
    set user_name = coalesce(nullif(trim(public.users.user_name), ''), profile_name),
        updated_at = now()
    where lower(trim(public.users.email)) = profile_email;

    if found then
        return;
    end if;

    select column_info.data_type,
           column_info.udt_name,
           column_info.column_default,
           column_info.is_identity
    into id_data_type, id_udt_name, id_default, id_is_identity
    from information_schema.columns as column_info
    where column_info.table_schema = 'public'
      and column_info.table_name = 'users'
      and column_info.column_name = 'id';

    if id_data_type = 'uuid' or id_udt_name = 'uuid' then
        insert into public.users (id, email, user_name, role, score, current_streak, created_at, updated_at)
        values (p_auth_id, profile_email, profile_name, 'user', 0, 0, coalesce(p_created_at, now()), now());
    elsif id_data_type in ('text', 'character varying', 'character') then
        insert into public.users (id, email, user_name, role, score, current_streak, created_at, updated_at)
        values (p_auth_id::text, profile_email, profile_name, 'user', 0, 0, coalesce(p_created_at, now()), now());
    elsif id_default is not null or id_is_identity = 'YES' then
        insert into public.users (email, user_name, role, score, current_streak, created_at, updated_at)
        values (profile_email, profile_name, 'user', 0, 0, coalesce(p_created_at, now()), now());
    else
        raise exception 'VieGeo cannot create a profile: public.users.id requires a value but has no compatible UUID/text type or default.';
    end if;
end;
$$;

create or replace function public.viegeo_create_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    perform public.viegeo_upsert_auth_profile(
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data, '{}'::jsonb),
        new.created_at
    );
    return new;
end;
$$;

-- Replace every old custom profile trigger; internal Supabase triggers stay.
do $$
declare
    trigger_record record;
begin
    for trigger_record in
        select trigger_info.tgname
        from pg_trigger as trigger_info
        join pg_class as table_info on table_info.oid = trigger_info.tgrelid
        join pg_namespace as schema_info on schema_info.oid = table_info.relnamespace
        where schema_info.nspname = 'auth'
          and table_info.relname = 'users'
          and not trigger_info.tgisinternal
    loop
        execute format('drop trigger if exists %I on auth.users', trigger_record.tgname);
    end loop;
end
$$;

create trigger viegeo_after_auth_user_created
    after insert on auth.users
    for each row execute function public.viegeo_create_user_profile();

-- Repair every existing Auth account that has no matching public profile.
do $$
declare
    auth_user record;
begin
    for auth_user in
        select id, email, raw_user_meta_data, created_at
        from auth.users
        where email is not null
    loop
        perform public.viegeo_upsert_auth_profile(
            auth_user.id,
            auth_user.email,
            coalesce(auth_user.raw_user_meta_data, '{}'::jsonb),
            auth_user.created_at
        );
    end loop;
end
$$;

commit;
