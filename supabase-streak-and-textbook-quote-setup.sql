-- VieGeo: streak theo ngày và trích dẫn SGK.
-- Chạy toàn bộ file này một lần trong Supabase SQL Editor.

begin;

alter table public.users add column if not exists last_active_date date;
alter table public.users add column if not exists streak_restored_on date;
alter table public.users add column if not exists account_status text not null default 'free';
alter table public.users add column if not exists roles text[] not null default array['user']::text[];
alter table public.questions add column if not exists textbook_quote text not null default '';

create index if not exists idx_users_last_active_date on public.users (last_active_date);

do $$
begin
    if to_regclass('public.premium_requests') is not null then
        update public.users as user_row
        set account_status = 'premium'
        where exists (
            select 1
            from public.premium_requests as request_row
            where lower(coalesce(to_jsonb(request_row)->>'user_email', to_jsonb(request_row)->>'email', '')) = lower(user_row.email)
              and lower(coalesce(to_jsonb(request_row)->>'status', '')) = 'approved'
        );
    end if;
end;
$$;

create or replace function public.refresh_user_streak(p_user_email text)
returns table(current_streak integer, was_reset boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
    profile public.users%rowtype;
    today_vn date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
    is_premium boolean := false;
    should_reset boolean := false;
begin
    select * into profile
    from public.users
    where lower(email) = lower(trim(p_user_email))
    for update;

    if not found then
        raise exception 'Không tìm thấy hồ sơ người dùng';
    end if;

    is_premium := lower(coalesce(profile.account_status, '')) = 'premium'
        or lower(coalesce(profile.role, '')) = 'premium'
        or 'premium' = any(coalesce(profile.roles, array[]::text[]));

    -- Tài khoản Premium có đúng một ngày ân hạn để phục hồi chuỗi.
    should_reset := profile.last_active_date is not null
        and profile.last_active_date < today_vn - (case when is_premium then 2 else 1 end);

    if should_reset and coalesce(profile.current_streak, 0) <> 0 then
        update public.users set current_streak = 0 where id = profile.id;
        profile.current_streak := 0;
    end if;

    return query select coalesce(profile.current_streak, 0), should_reset;
end;
$$;

create or replace function public.apply_lesson_streak(p_user_email text, p_stars integer)
returns table(current_streak integer, awarded boolean, recovered boolean, reset boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
    profile public.users%rowtype;
    today_vn date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
    last_date date;
    is_premium boolean := false;
    next_streak integer := 0;
    did_award boolean := false;
    did_recover boolean := false;
    did_reset boolean := false;
begin
    if coalesce(p_stars, 0) < 0 or coalesce(p_stars, 0) > 3 then
        raise exception 'Số sao không hợp lệ';
    end if;

    select * into profile
    from public.users
    where lower(email) = lower(trim(p_user_email))
    for update;

    if not found then
        raise exception 'Không tìm thấy hồ sơ người dùng';
    end if;

    is_premium := lower(coalesce(profile.account_status, '')) = 'premium'
        or lower(coalesce(profile.role, '')) = 'premium'
        or 'premium' = any(coalesce(profile.roles, array[]::text[]));
    last_date := profile.last_active_date;
    next_streak := greatest(0, coalesce(profile.current_streak, 0));

    -- Reset nếu đã bỏ lỡ quá số ngày được phép. Premium có một ngày phục hồi.
    if last_date is not null and last_date < today_vn - (case when is_premium then 2 else 1 end) then
        next_streak := 0;
        did_reset := profile.current_streak <> 0;
    end if;

    -- Chỉ bài đạt từ 2 sao mới đủ điều kiện duy trì/tăng chuỗi.
    if coalesce(p_stars, 0) >= 2 then
        if last_date = today_vn then
            null; -- Một ngày chỉ tăng tối đa một lần.
        elsif last_date = today_vn - 1 then
            next_streak := greatest(0, next_streak) + 1;
            did_award := true;
        elsif is_premium and last_date = today_vn - 2 then
            next_streak := greatest(0, next_streak) + 1;
            did_award := true;
            did_recover := true;
        else
            next_streak := 1;
            did_award := true;
        end if;

        update public.users
        set current_streak = next_streak,
            last_active_date = today_vn,
            streak_restored_on = case when did_recover then today_vn else streak_restored_on end
        where id = profile.id;
    elsif did_reset then
        update public.users set current_streak = 0 where id = profile.id;
    end if;

    return query select next_streak, did_award, did_recover, did_reset;
end;
$$;

-- Chạy hằng ngày ở 00:05 giờ Việt Nam khi pg_cron đã được bật.
create or replace function public.reset_expired_streaks()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    today_vn date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
    affected integer := 0;
begin
    update public.users
    set current_streak = 0
    where current_streak <> 0
      and last_active_date is not null
      and last_active_date < today_vn - (case
          when lower(coalesce(account_status, '')) = 'premium'
              or lower(coalesce(role, '')) = 'premium'
              or 'premium' = any(coalesce(roles, array[]::text[]))
          then 2 else 1 end);
    get diagnostics affected = row_count;
    return affected;
end;
$$;

grant execute on function public.refresh_user_streak(text) to anon, authenticated;
grant execute on function public.apply_lesson_streak(text, integer) to anon, authenticated;
grant execute on function public.reset_expired_streaks() to authenticated;

-- 00:05 giờ Việt Nam (17:05 UTC ngày hôm trước) nếu dự án đã bật extension pg_cron.
do $$
begin
    if exists (select 1 from pg_extension where extname = 'pg_cron') then
        if not exists (select 1 from cron.job where jobname = 'viegeo_reset_expired_streaks') then
            perform cron.schedule(
                'viegeo_reset_expired_streaks',
                '5 17 * * *',
                'select public.reset_expired_streaks();'
            );
        end if;
    end if;
exception when others then
    raise notice 'Không thể tạo lịch reset Streak tự động: %', sqlerrm;
end;
$$;

commit;

-- Bản nâng cấp: hồ sơ SGK và quyền phục hồi Streak Premium tối đa 3 lần/tháng.
begin;

alter table public.users add column if not exists age smallint;
alter table public.users add column if not exists school_grade smallint;
alter table public.users add column if not exists textbook_curriculum text not null default 'Chương trình GDPT 2018';
alter table public.users add column if not exists streak_restore_month date;
alter table public.users add column if not exists streak_restores_used smallint not null default 0;
alter table public.users add column if not exists streak_restore_value integer not null default 0;
alter table public.users add column if not exists streak_lost_on date;

alter table public.users drop constraint if exists users_age_range_check;
alter table public.users add constraint users_age_range_check check (age is null or age between 6 and 100);
alter table public.users drop constraint if exists users_school_grade_range_check;
alter table public.users add constraint users_school_grade_range_check check (school_grade is null or school_grade between 6 and 12);

create or replace function public.refresh_user_streak(p_user_email text)
returns table(current_streak integer, was_reset boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
    profile public.users%rowtype;
    today_vn date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
    caller_email text := lower(coalesce(auth.jwt()->>'email', ''));
    did_reset boolean := false;
begin
    if caller_email = '' or caller_email <> lower(trim(p_user_email)) then
        raise exception 'Không được phép làm mới Streak của tài khoản này';
    end if;

    select * into profile from public.users where lower(email) = caller_email for update;
    if not found then
        raise exception 'Không tìm thấy hồ sơ người dùng';
    end if;

    if profile.last_active_date is not null
        and profile.last_active_date < today_vn - 1
        and coalesce(profile.current_streak, 0) > 0 then
        update public.users
        set current_streak = 0,
            streak_restore_value = greatest(coalesce(streak_restore_value, 0), coalesce(current_streak, 0)),
            streak_lost_on = today_vn
        where id = profile.id;
        profile.current_streak := 0;
        did_reset := true;
    end if;

    return query select coalesce(profile.current_streak, 0), did_reset;
end;
$$;

create or replace function public.apply_lesson_streak(p_user_email text, p_stars integer)
returns table(current_streak integer, awarded boolean, recovered boolean, reset boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
    profile public.users%rowtype;
    today_vn date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
    caller_email text := lower(coalesce(auth.jwt()->>'email', ''));
    next_streak integer := 0;
    did_award boolean := false;
    did_reset boolean := false;
begin
    if caller_email = '' or caller_email <> lower(trim(p_user_email)) then
        raise exception 'Không được phép cập nhật Streak của tài khoản này';
    end if;
    if coalesce(p_stars, 0) < 0 or coalesce(p_stars, 0) > 3 then
        raise exception 'Số sao không hợp lệ';
    end if;

    select * into profile from public.users where lower(email) = caller_email for update;
    if not found then
        raise exception 'Không tìm thấy hồ sơ người dùng';
    end if;

    next_streak := greatest(0, coalesce(profile.current_streak, 0));
    if profile.last_active_date is not null
        and profile.last_active_date < today_vn - 1
        and next_streak > 0 then
        update public.users
        set current_streak = 0,
            streak_restore_value = greatest(coalesce(streak_restore_value, 0), next_streak),
            streak_lost_on = today_vn
        where id = profile.id;
        next_streak := 0;
        did_reset := true;
    end if;

    if coalesce(p_stars, 0) >= 2 then
        if profile.last_active_date = today_vn then
            null;
        elsif profile.last_active_date = today_vn - 1 then
            next_streak := next_streak + 1;
            did_award := true;
        else
            next_streak := 1;
            did_award := true;
        end if;

        update public.users
        set current_streak = next_streak,
            last_active_date = today_vn
        where id = profile.id;
    end if;

    return query select next_streak, did_award, false, did_reset;
end;
$$;

create or replace function public.restore_premium_streak(p_user_email text)
returns table(current_streak integer, restored boolean, restores_used integer, restores_remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
    profile public.users%rowtype;
    today_vn date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
    month_vn date := date_trunc('month', (now() at time zone 'Asia/Ho_Chi_Minh'))::date;
    caller_email text := lower(coalesce(auth.jwt()->>'email', ''));
    premium boolean := false;
    used_count integer := 0;
    restored_streak integer := 0;
begin
    if caller_email = '' or caller_email <> lower(trim(p_user_email)) then
        raise exception 'Không được phép phục hồi Streak của tài khoản này';
    end if;

    select * into profile from public.users where lower(email) = caller_email for update;
    if not found then
        raise exception 'Không tìm thấy hồ sơ người dùng';
    end if;

    premium := lower(coalesce(profile.account_status, '')) = 'premium'
        or lower(coalesce(profile.role, '')) = 'premium'
        or 'premium' = any(coalesce(profile.roles, array[]::text[]));
    if not premium then
        raise exception 'Tính năng phục hồi Streak dành cho tài khoản Premium';
    end if;
    if profile.streak_lost_on is distinct from today_vn or coalesce(profile.streak_restore_value, 0) <= 0 then
        raise exception 'Chỉ có thể phục hồi chuỗi ngay trong ngày chuỗi bị mất';
    end if;

    used_count := case when profile.streak_restore_month = month_vn then coalesce(profile.streak_restores_used, 0) else 0 end;
    if used_count >= 3 then
        raise exception 'Bạn đã dùng hết 3 lượt phục hồi Streak trong tháng này';
    end if;

    used_count := used_count + 1;
    restored_streak := greatest(0, profile.streak_restore_value)
        + case when profile.last_active_date = today_vn then 1 else 0 end;
    update public.users
    set current_streak = restored_streak,
        last_active_date = case when profile.last_active_date = today_vn then today_vn else today_vn - 1 end,
        streak_restore_month = month_vn,
        streak_restores_used = used_count,
        streak_restore_value = 0,
        streak_lost_on = null
    where id = profile.id;

    return query select restored_streak, true, used_count, greatest(0, 3 - used_count);
end;
$$;

create or replace function public.reset_expired_streaks()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    today_vn date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
    affected integer := 0;
begin
    update public.users
    set current_streak = 0,
        streak_restore_value = greatest(coalesce(streak_restore_value, 0), coalesce(current_streak, 0)),
        streak_lost_on = today_vn
    where current_streak > 0
      and last_active_date is not null
      and last_active_date < today_vn - 1;
    get diagnostics affected = row_count;
    return affected;
end;
$$;

revoke all on function public.refresh_user_streak(text) from anon;
revoke all on function public.apply_lesson_streak(text, integer) from anon;
grant execute on function public.refresh_user_streak(text) to authenticated;
grant execute on function public.apply_lesson_streak(text, integer) to authenticated;
grant execute on function public.restore_premium_streak(text) to authenticated;

commit;
