// Edge Function: لما بلاغ جديد يغيّر حالة محطة، نبعت إشعار لكل اللي بيراقبوها (حتى لو التطبيق مقفول).
// بيشتغل من trigger على INSERT في wasla_check_ins (شوف backend/webhook.sql).

import { createClient } from 'npm:@supabase/supabase-js@2.119.2';

import { computeStationState, statusLabel } from '../_shared/status.ts';
import type { CheckIn, StationStatus } from '../_shared/types.ts';

interface Row {
  id: string;
  station_id: string;
  plug_id: string | null;
  kind: CheckIn['kind'];
  user_id: string;
  at: string;
}

const toCheckIn = (r: Row): CheckIn => ({ id: r.id, stationId: r.station_id, plugId: r.plug_id, kind: r.kind, userId: r.user_id, at: Date.parse(r.at) });

const titles: Record<StationStatus, string> = {
  working: 'في شاحن شغّال دلوقتي',
  broken: 'المحطة بقت بايظة',
  queue: 'في طابور على المحطة',
  conflict: 'بلاغ إن المحطة ممكن تكون بايظة',
  unknown: 'تحديث من المحطة',
};

Deno.serve(async (req) => {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // الحماية: الـ trigger بيبعت سر محفوظ في Vault، والـ function بتقارنه بنفس السر
  const { data: secret } = await sb.rpc('wasla_webhook_secret');
  if (!secret || req.headers.get('x-webhook-secret') !== secret) return new Response('forbidden', { status: 403 });

  const payload = await req.json();
  if (payload?.type !== 'INSERT' || payload?.table !== 'wasla_check_ins') return new Response('ignored');
  const rec = payload.record as Row;

  const since = new Date(Date.parse(rec.at) - 24 * 3600_000).toISOString();
  const { data: rows, error } = await sb.from('wasla_check_ins').select('*').eq('station_id', rec.station_id).gte('at', since);
  if (error) return new Response(error.message, { status: 500 });

  const all = (rows as Row[]).map(toCheckIn);
  const now = Date.parse(rec.at);
  const before = computeStationState(all.filter((c) => c.id !== rec.id), now - 1).status;
  const after = computeStationState(all, now).status;
  if (before === after) return new Response('no change');

  const { data: station } = await sb.from('wasla_stations').select('name').eq('id', rec.station_id).single();
  const { data: watchers } = await sb.from('wasla_watches').select('user_id').eq('station_id', rec.station_id).neq('user_id', rec.user_id);
  const userIds = (watchers ?? []).map((w: { user_id: string }) => w.user_id);
  if (userIds.length === 0) return new Response('no watchers');

  const { data: tokens } = await sb.from('wasla_push_tokens').select('token').in('user_id', userIds);
  const name = station?.name ?? 'المحطة';
  const body = after === 'working' ? `${name} رجعت تشتغل · سواق لسه مأكد` : `${name} بقت «${statusLabel(after)}»`;

  const messages = (tokens ?? []).map((t: { token: string }) => ({
    to: t.token,
    title: titles[after],
    body,
    sound: 'default',
    channelId: 'stations',
    data: { stationId: rec.station_id },
  }));

  // Expo بياخد لحد 100 رسالة في الطلب
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(messages.slice(i, i + 100)),
    });
    if (res.ok) sent += Math.min(100, messages.length - i);
  }

  return Response.json({ before, after, watchers: userIds.length, sent });
});
