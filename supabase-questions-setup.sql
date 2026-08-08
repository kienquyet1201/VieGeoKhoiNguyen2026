create table if not exists public.questions (
    id bigserial primary key,
    question text not null,
    option_a text not null,
    option_b text not null,
    option_c text not null,
    option_d text not null,
    correct_option integer not null check (correct_option between 0 and 3),
    province text not null default 'ha-noi',
    island text not null default 'Đảo nhỏ 1',
    topic text not null default 'Kiến thức địa lí',
    theory text default '',
    hint1 text default '',
    hint2 text default '',
    difficulty text not null default 'easy' check (difficulty in ('easy', 'medium', 'hard')),
    sub_island integer default 1,
    island_theory text default '',
    grade text default '',
    lesson_id text default '',
    import_order integer,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Repair/upgrade path for projects that created questions with an older schema.
-- Safe to run repeatedly: existing columns are kept, missing columns are added.
alter table public.questions add column if not exists id bigserial;
alter table public.questions add column if not exists question text;
alter table public.questions add column if not exists option_a text;
alter table public.questions add column if not exists option_b text;
alter table public.questions add column if not exists option_c text;
alter table public.questions add column if not exists option_d text;
alter table public.questions add column if not exists correct_option integer default 0;
alter table public.questions add column if not exists province text default 'ha-noi';
alter table public.questions add column if not exists island text default 'Đảo nhỏ 1';
alter table public.questions add column if not exists topic text default 'Kiến thức địa lí';
alter table public.questions add column if not exists theory text default '';
alter table public.questions add column if not exists hint1 text default '';
alter table public.questions add column if not exists hint2 text default '';
alter table public.questions add column if not exists difficulty text default 'easy';
alter table public.questions add column if not exists sub_island integer default 1;
alter table public.questions add column if not exists island_theory text default '';
alter table public.questions add column if not exists grade text default '';
alter table public.questions add column if not exists lesson_id text default '';
alter table public.questions add column if not exists import_order integer;
alter table public.questions add column if not exists created_at timestamptz default now();
alter table public.questions add column if not exists updated_at timestamptz default now();

create unique index if not exists questions_question_unique_idx
    on public.questions (question);

create unique index if not exists questions_id_unique_idx
    on public.questions (id);

alter table public.questions disable row level security;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.questions to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

insert into public.questions (
    question,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_option,
    province,
    island,
    topic,
    theory,
    hint1,
    hint2,
    difficulty,
    sub_island,
    island_theory,
    import_order
) values
(
    'Hà Nội là Thủ đô của quốc gia nào?',
    'Việt Nam',
    'Lào',
    'Thái Lan',
    'Campuchia',
    0,
    'ha-noi',
    'Đảo nhỏ 1',
    'Vị trí và vai trò của Hà Nội',
    'Hà Nội là Thủ đô của nước Cộng hòa xã hội chủ nghĩa Việt Nam, trung tâm chính trị, hành chính và văn hóa lớn của cả nước.',
    'Hãy nhớ Hà Nội là trung tâm chính trị của Việt Nam.',
    'Đây là nơi đặt trụ sở Quốc hội, Chính phủ và nhiều cơ quan trung ương.',
    'easy',
    1,
    'Hà Nội là Thủ đô của Việt Nam, nằm ở miền Bắc và thuộc vùng Đồng bằng sông Hồng. Thành phố có lịch sử hơn một nghìn năm và giữ vai trò trung tâm chính trị, văn hóa, giáo dục của cả nước.',
    1
),
(
    'Hà Nội thuộc vùng địa lí nào của Việt Nam?',
    'Đồng bằng sông Hồng',
    'Tây Nguyên',
    'Đông Nam Bộ',
    'Duyên hải Nam Trung Bộ',
    0,
    'ha-noi',
    'Đảo nhỏ 1',
    'Vùng địa lí Hà Nội',
    'Hà Nội thuộc vùng Đồng bằng sông Hồng, khu vực có đất đai màu mỡ, dân cư đông đúc và truyền thống văn minh lúa nước lâu đời.',
    'Hãy liên hệ Hà Nội với hệ thống sông Hồng.',
    'Vùng này nổi tiếng với đồng bằng phù sa và dân cư đông.',
    'easy',
    1,
    'Hà Nội nằm trong vùng Đồng bằng sông Hồng, nơi có lịch sử cư trú lâu đời, nhiều làng nghề và nền văn minh lúa nước đặc trưng.',
    2
),
(
    'Di tích nào sau đây gắn liền với truyền thống hiếu học của Hà Nội?',
    'Văn Miếu - Quốc Tử Giám',
    'Chợ Bến Thành',
    'Cầu Rồng',
    'Mũi Né',
    0,
    'ha-noi',
    'Đảo nhỏ 1',
    'Di tích tiêu biểu của Hà Nội',
    'Văn Miếu - Quốc Tử Giám là biểu tượng của truyền thống hiếu học, khoa bảng và giáo dục lâu đời ở Hà Nội.',
    'Hãy chọn di tích nổi tiếng về giáo dục và khoa bảng.',
    'Đây là nơi thường được nhắc đến như trường đại học đầu tiên của Việt Nam.',
    'medium',
    1,
    'Hà Nội nổi bật với nhiều di tích lịch sử như Hồ Gươm, Văn Miếu - Quốc Tử Giám, Hoàng thành Thăng Long và Lăng Chủ tịch Hồ Chí Minh.',
    3
)
on conflict (question) do update set
    option_a = excluded.option_a,
    option_b = excluded.option_b,
    option_c = excluded.option_c,
    option_d = excluded.option_d,
    correct_option = excluded.correct_option,
    province = excluded.province,
    island = excluded.island,
    topic = excluded.topic,
    theory = excluded.theory,
    hint1 = excluded.hint1,
    hint2 = excluded.hint2,
    difficulty = excluded.difficulty,
    sub_island = excluded.sub_island,
    island_theory = excluded.island_theory,
    import_order = excluded.import_order,
    updated_at = now();
