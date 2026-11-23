-- بيربط جدول البلاغات بالـ Edge Function بتاعة الإشعارات.
-- شغّله بعد ما تعمل deploy لـ notify-watchers، وبعد ما تغيّر:
--   <PROJECT_REF>     كود المشروع في Supabase
--   <WEBHOOK_SECRET>  نفس القيمة اللي حطيتها في secrets بتاعة الـ function

create extension if not exists pg_net;

create or replace function public.wasla_notify_watchers_hook() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/wasla-notify-watchers',
    headers := jsonb_build_object('content-type', 'application/json', 'x-webhook-secret', '<WEBHOOK_SECRET>'),
    body := jsonb_build_object('type', 'INSERT', 'table', 'wasla_check_ins', 'record', to_jsonb(new))
  );
  return new;
end $$;

drop trigger if exists wasla_notify_watchers on public.wasla_check_ins;
create trigger wasla_notify_watchers after insert on public.wasla_check_ins
  for each row execute function public.wasla_notify_watchers_hook();
