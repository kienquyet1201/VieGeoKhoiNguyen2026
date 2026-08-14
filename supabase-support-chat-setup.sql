begin;

create table if not exists public.support_tickets (
    id text primary key,
    user_id text,
    user_email text not null,
    user_name text,
    user_role text not null default 'user',
    subject text not null default 'Yêu cầu hỗ trợ',
    category text not null default 'general',
    priority text not null default 'normal',
    status text not null default 'pending',
    last_message text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_at_client bigint,
    updated_at_client bigint
);

create table if not exists public.support_messages (
    id text primary key,
    ticket_id text not null references public.support_tickets(id) on delete cascade,
    sender text not null,
    sender_id text,
    sender_email text,
    sender_name text,
    sender_role text,
    message text not null,
    is_internal boolean not null default false,
    status text not null default 'sent',
    created_at timestamptz not null default now(),
    created_at_client bigint
);

create index if not exists idx_support_tickets_email on public.support_tickets (user_email);
create index if not exists idx_support_tickets_status on public.support_tickets (status);
create index if not exists idx_support_tickets_updated on public.support_tickets (updated_at desc);
create index if not exists idx_support_messages_ticket on public.support_messages (ticket_id, created_at asc);

alter table public.support_tickets disable row level security;
alter table public.support_messages disable row level security;
grant select, insert, update, delete on table public.support_tickets to anon, authenticated;
grant select, insert, update, delete on table public.support_messages to anon, authenticated;

commit;
notify pgrst, 'reload schema';
