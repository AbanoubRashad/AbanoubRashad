-- وَصلة شحن — قاعدة البيانات (Supabase / Postgres)
-- الترتيب: schema.sql الأول، بعده seed.sql.
-- آمن إنه يتشغّل أكتر من مرة.

-- ============ الجداول ============

create table if not exists public.wasla_stations (
  id            text primary key,
  name          text not null,
  operator      text not null default 'غير معروف',
  area          text not null check (area in ('أكتوبر', 'زايد', 'الصحراوي')),
  quality       text not null default 'من الإنترنت – محتاج تأكيد',
  lat           double precision not null,
  lng           double precision not null,
  approximate   boolean not null default true,
  price         text,
  hours         text,
  nearby        text[] not null default '{}',
  notes         text,
  source        text,
  on_highway    boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists public.wasla_plugs (
  station_id  text not null references public.wasla_stations(id) on delete cascade,
  id          text not null,               -- '01', '02'...
  connector   text not null check (connector in ('CCS2', 'Type 2', 'GB/T', 'CHAdeMO')),
  kw          numeric,
  primary key (station_id, id)
);

-- بلاغات السواقين: أساس حالة كل محطة
create table if not exists public.wasla_check_ins (
  id          uuid primary key default gen_random_uuid(),
  station_id  text not null references public.wasla_stations(id) on delete cascade,
  plug_id     text,
  kind        text not null check (kind in ('ok', 'broken', 'queue')),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  at          timestamptz not null default now(),
  photo_path  text
);
alter table public.wasla_check_ins add column if not exists photo_path text;
create index if not exists wasla_check_ins_station_at on public.wasla_check_ins (station_id, at desc);
create index if not exists wasla_check_ins_user on public.wasla_check_ins (user_id);

-- محطات ضافها المستخدمين، مستنية مراجعة
create table if not exists public.wasla_pending_stations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 3 and 120),
  operator    text not null,
  connector   text not null check (connector in ('CCS2', 'Type 2', 'GB/T', 'CHAdeMO')),
  kw          numeric,
  count       int not null check (count between 1 and 20),
  lat         double precision not null,
  lng         double precision not null,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now()
);
create index if not exists wasla_pending_stations_user on public.wasla_pending_stations (user_id);

-- المحطات اللي المستخدم بيراقبها
create table if not exists public.wasla_watches (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  station_id  text not null references public.wasla_stations(id) on delete cascade,
  primary key (user_id, station_id)
);
create index if not exists wasla_watches_station on public.wasla_watches (station_id);

-- أجهزة المستخدم للإشعارات (Expo push tokens)
create table if not exists public.wasla_push_tokens (
  token       text primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  platform    text,
  updated_at  timestamptz not null default now()
);
create index if not exists wasla_push_tokens_user on public.wasla_push_tokens (user_id);

-- ============ الصلاحيات (RLS) ============

alter table public.wasla_stations         enable row level security;
alter table public.wasla_plugs            enable row level security;
alter table public.wasla_check_ins        enable row level security;
alter table public.wasla_pending_stations enable row level security;
alter table public.wasla_watches          enable row level security;
alter table public.wasla_push_tokens      enable row level security;

drop policy if exists "stations readable" on public.wasla_stations;
drop policy if exists "plugs readable" on public.wasla_plugs;
drop policy if exists "check-ins readable" on public.wasla_check_ins;
drop policy if exists "report as self" on public.wasla_check_ins;
drop policy if exists "suggest as self" on public.wasla_pending_stations;
drop policy if exists "see own suggestions" on public.wasla_pending_stations;
drop policy if exists "own watches" on public.wasla_watches;
drop policy if exists "own push tokens" on public.wasla_push_tokens;

-- أي حد يقدر يشوف الخريطة من غير حساب
create policy "stations readable"  on public.wasla_stations  for select to anon, authenticated using (true);
create policy "plugs readable"     on public.wasla_plugs     for select to anon, authenticated using (true);
create policy "check-ins readable" on public.wasla_check_ins for select to anon, authenticated using (true);

-- التبليغ والإضافة محتاجين حساب، وكل واحد بيكتب باسمه بس
create policy "report as self" on public.wasla_check_ins
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "suggest as self" on public.wasla_pending_stations
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "see own suggestions" on public.wasla_pending_stations
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own watches" on public.wasla_watches
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own push tokens" on public.wasla_push_tokens
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ============ قواعد البلاغ ============

-- الوقت بييجي من السيرفر مش من الموبايل، وبلاغ واحد كل 10 دقايق لنفس المحطة
create or replace function public.wasla_check_in_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.at := now();
  if exists (
    select 1 from public.wasla_check_ins
    where station_id = new.station_id and user_id = new.user_id and at > now() - interval '10 minutes'
  ) then
    raise exception 'استنى شوية قبل ما تبلّغ تاني عن نفس المحطة';
  end if;
  return new;
end $$;

drop trigger if exists wasla_check_in_guard on public.wasla_check_ins;
create trigger wasla_check_in_guard before insert on public.wasla_check_ins
  for each row execute function public.wasla_check_in_guard();

-- ============ التحديث اللحظي ============

do $$ begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'wasla_check_ins'
  ) then
    alter publication supabase_realtime add table public.wasla_check_ins;
  end if;
end $$;

-- ============ صور البلاغات ============

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wasla-checkin-photos', 'wasla-checkin-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "wasla: upload own checkin photos" on storage.objects;
drop policy if exists "wasla: read checkin photos" on storage.objects;

-- كل مستخدم يرفع جوه فولدر باسمه بس
create policy "wasla: upload own checkin photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'wasla-checkin-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "wasla: read checkin photos" on storage.objects
  for select to authenticated using (bucket_id = 'wasla-checkin-photos');

-- الـ trigger بس هو اللي يشغّلها
revoke execute on function public.wasla_check_in_guard() from public, anon, authenticated;
