-- وَصلة شحن — قاعدة البيانات (Supabase / Postgres)
-- المرحلة الجاية: التطبيق لسه بيحفظ على الموبايل بس (AsyncStorage).
-- الملف ده جاهز يتشغّل في Supabase SQL Editor لما نعمل المشروع.

create table if not exists public.stations (
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

create table if not exists public.plugs (
  station_id  text not null references public.stations(id) on delete cascade,
  id          text not null,               -- '01', '02'...
  connector   text not null check (connector in ('CCS2', 'Type 2', 'GB/T', 'CHAdeMO')),
  kw          numeric,
  primary key (station_id, id)
);

-- بلاغات السواقين: أساس حالة كل محطة
create table if not exists public.check_ins (
  id          uuid primary key default gen_random_uuid(),
  station_id  text not null references public.stations(id) on delete cascade,
  plug_id     text,
  kind        text not null check (kind in ('ok', 'broken', 'queue')),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  at          timestamptz not null default now()
);
create index if not exists check_ins_station_at on public.check_ins (station_id, at desc);

-- محطات ضافها المستخدمين، مستنية مراجعة
create table if not exists public.pending_stations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 3 and 120),
  operator    text not null,
  connector   text not null,
  kw          numeric,
  count       int not null check (count between 1 and 20),
  lat         double precision not null,
  lng         double precision not null,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now()
);

-- المحطات اللي المستخدم بيراقبها
create table if not exists public.watches (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  station_id  text not null references public.stations(id) on delete cascade,
  primary key (user_id, station_id)
);

-- الصلاحيات (RLS)
alter table public.stations         enable row level security;
alter table public.plugs            enable row level security;
alter table public.check_ins        enable row level security;
alter table public.pending_stations enable row level security;
alter table public.watches          enable row level security;

-- أي حد يقدر يشوف الخريطة من غير حساب
create policy "stations readable" on public.stations for select using (true);
create policy "plugs readable"    on public.plugs    for select using (true);
create policy "check-ins readable" on public.check_ins for select using (true);

-- التبليغ والإضافة محتاجين حساب، وكل واحد بيكتب باسمه بس
create policy "report as self" on public.check_ins
  for insert to authenticated with check (user_id = auth.uid());
create policy "suggest as self" on public.pending_stations
  for insert to authenticated with check (user_id = auth.uid());
create policy "see own suggestions" on public.pending_stations
  for select to authenticated using (user_id = auth.uid());
create policy "own watches" on public.watches
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- حماية من السبام: بلاغ واحد لكل مستخدم على نفس المحطة كل 10 دقايق
create or replace function public.check_in_rate_limit() returns trigger language plpgsql as $$
begin
  if exists (
    select 1 from public.check_ins
    where station_id = new.station_id and user_id = new.user_id and at > now() - interval '10 minutes'
  ) then
    raise exception 'استنى شوية قبل ما تبلّغ تاني عن نفس المحطة';
  end if;
  return new;
end $$;

drop trigger if exists check_in_rate_limit on public.check_ins;
create trigger check_in_rate_limit before insert on public.check_ins
  for each row execute function public.check_in_rate_limit();
