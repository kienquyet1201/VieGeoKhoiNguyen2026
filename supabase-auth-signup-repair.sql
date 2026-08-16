-- VieGeo: repair Auth signup -> public.users synchronization.
-- Safe to run more than once in Supabase SQL Editor.

begin;

create or replace function public.viegeo_create_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    profile_email text := lower(trim(new.email));
    profile_name text := coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'user_name'), ''),
        nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
        nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
        split_part(profile_email, '@', 1),
        'Học viên'
    );
begin
    if profile_email is null or profile_email = '' then
        raise exception 'VieGeo signup requires a valid email';
    end if;

    insert into public.users (
        id,
        email,
        user_email,
        user_name,
        score,
        current_streak,
        role,
        created_at
    ) values (
        new.id,
        profile_email,
        profile_email,
        profile_name,
        0,
        0,
        'student',
        coalesce(new.created_at, now())
    )
    on conflict (email) do update set
        user_email = excluded.user_email,
        user_name = coalesce(nullif(trim(public.users.user_name), ''), excluded.user_name);

    return new;
end;
$$;

-- Remove only custom Auth triggers that write to public.users. Internal Auth
-- triggers and unrelated project triggers are left untouched.
do $$
declare
    trigger_record record;
begin
    for trigger_record in
        select trigger_info.tgname
        from pg_trigger as trigger_info
        join pg_class as table_info on table_info.oid = trigger_info.tgrelid
        join pg_namespace as schema_info on schema_info.oid = table_info.relnamespace
        join pg_proc as function_info on function_info.oid = trigger_info.tgfoid
        where schema_info.nspname = 'auth'
          and table_info.relname = 'users'
          and not trigger_info.tgisinternal
          and (
              function_info.prosrc ilike '%public.users%'
              or trigger_info.tgname in ('on_auth_user_created', 'trg_create_user_profile')
          )
    loop
        execute format('drop trigger if exists %I on auth.users', trigger_record.tgname);
    end loop;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.viegeo_create_user_profile();

commit;

