-- بيربط جدول البلاغات بالـ Edge Function بتاعة الإشعارات (wasla-notify-watchers).
-- السر بيتولّد هنا ويتحفظ في Vault، والـ function بتقراه بالـ service role. محدش محتاج يكتبه بإيده.

create extension if not exists pg_net;

do $$ begin
  if not exists (select 1 from vault.secrets where name = 'wasla_webhook_secret') then
    perform vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'wasla_webhook_secret');
  end if;
end $$;

create or replace function public.wasla_webhook_secret() returns text
language sql security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'wasla_webhook_secret' limit 1
$$;
revoke execute on function public.wasla_webhook_secret() from public, anon, authenticated;
grant execute on function public.wasla_webhook_secret() to service_role;

create or replace function public.wasla_notify_watchers_hook() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform net.http_post(
    url := 'https://phmfkypybvofzosfbbet.supabase.co/functions/v1/wasla-notify-watchers',
    headers := jsonb_build_object('content-type', 'application/json', 'x-webhook-secret', public.wasla_webhook_secret()),
    body := jsonb_build_object('type', 'INSERT', 'table', 'wasla_check_ins', 'record', to_jsonb(new))
  );
  return new;
end $$;
revoke execute on function public.wasla_notify_watchers_hook() from public, anon, authenticated;

drop trigger if exists wasla_notify_watchers on public.wasla_check_ins;
create trigger wasla_notify_watchers after insert on public.wasla_check_ins
  for each row execute function public.wasla_notify_watchers_hook();
