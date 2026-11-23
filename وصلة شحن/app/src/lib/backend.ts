import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { CheckIn, Connector, ReportKind, Station } from '../domain/types';

/**
 * الاتصال بـ Supabase.
 * لو EXPO_PUBLIC_SUPABASE_URL و EXPO_PUBLIC_SUPABASE_KEY مش متحطين في app/.env
 * التطبيق بيشتغل «محلي»: كل حاجة بتتحفظ على الموبايل بس.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: Platform.OS === 'web' && typeof window === 'undefined' ? undefined : AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export const isRemote = supabase !== null;

/** 01012345678 → +201012345678 */
export function toE164(localPhone: string) {
  return '+20' + localPhone.replace(/^0/, '');
}

// ---------- قراءة ----------

interface StationRow {
  id: string;
  name: string;
  operator: string;
  area: Station['area'];
  quality: Station['quality'];
  lat: number;
  lng: number;
  approximate: boolean;
  price: string | null;
  hours: string | null;
  nearby: string[];
  notes: string | null;
  source: string | null;
  on_highway: boolean;
  plugs: { id: string; connector: Connector; kw: number | null }[];
}

export async function fetchStations(): Promise<Station[]> {
  if (!supabase) throw new Error('offline');
  const { data, error } = await supabase.from('wasla_stations').select('*, plugs:wasla_plugs(id, connector, kw)').order('name');
  if (error) throw error;
  return (data as StationRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    operator: r.operator,
    area: r.area,
    quality: r.quality,
    lat: r.lat,
    lng: r.lng,
    approximate: r.approximate,
    price: r.price,
    hours: r.hours,
    nearby: r.nearby ?? [],
    notes: r.notes,
    source: r.source ?? '',
    onHighway: r.on_highway,
    plugs: [...(r.plugs ?? [])].sort((a, b) => a.id.localeCompare(b.id)).map((p) => ({ ...p, kw: p.kw === null ? null : Number(p.kw) })),
  }));
}

interface CheckInRow {
  id: string;
  station_id: string;
  plug_id: string | null;
  kind: ReportKind;
  user_id: string;
  at: string;
  photo_path: string | null;
}

const rowToCheckIn = (r: CheckInRow): CheckIn => ({
  id: r.id,
  stationId: r.station_id,
  plugId: r.plug_id,
  kind: r.kind,
  userId: r.user_id,
  at: Date.parse(r.at),
  photoPath: r.photo_path,
});

/** بلاغات آخر 24 ساعة — كفاية لحساب الحالة وشريط التاريخ */
export async function fetchRecentCheckIns(sinceMs = 24 * 3600_000): Promise<CheckIn[]> {
  if (!supabase) throw new Error('offline');
  const since = new Date(Date.now() - sinceMs).toISOString();
  const { data, error } = await supabase.from('wasla_check_ins').select('*').gte('at', since).order('at', { ascending: false }).limit(5000);
  if (error) throw error;
  return (data as CheckInRow[]).map(rowToCheckIn);
}

/** بلاغات جديدة لحظة بلحظة */
export function subscribeCheckIns(onInsert: (c: CheckIn) => void): () => void {
  if (!supabase) return () => {};
  const channel = supabase
    .channel('check_ins_live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wasla_check_ins' }, (payload) => onInsert(rowToCheckIn(payload.new as CheckInRow)))
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------- كتابة ----------

export async function insertCheckIn(input: { stationId: string; plugId: string | null; kind: ReportKind; photoUri?: string | null }): Promise<CheckIn> {
  if (!supabase) throw new Error('offline');
  let photo_path: string | null = null;
  if (input.photoUri) photo_path = await uploadPhoto(input.photoUri, input.stationId);
  const { data, error } = await supabase
    .from('wasla_check_ins')
    .insert({ station_id: input.stationId, plug_id: input.plugId, kind: input.kind, photo_path })
    .select()
    .single();
  if (error) throw error;
  return rowToCheckIn(data as CheckInRow);
}

async function uploadPhoto(uri: string, stationId: string): Promise<string> {
  if (!supabase) throw new Error('offline');
  const { data: u } = await supabase.auth.getUser();
  const path = `${u.user?.id}/${stationId}-${Date.now()}.jpg`;
  const body = await (await fetch(uri)).arrayBuffer();
  const { error } = await supabase.storage.from('wasla-checkin-photos').upload(path, body, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}

export async function insertPendingStation(s: { name: string; operator: string; connector: Connector; kw: number | null; count: number; lat: number; lng: number }) {
  if (!supabase) throw new Error('offline');
  const { error } = await supabase.from('wasla_pending_stations').insert(s);
  if (error) throw error;
}

export async function fetchWatches(): Promise<string[]> {
  if (!supabase) throw new Error('offline');
  const { data, error } = await supabase.from('wasla_watches').select('station_id');
  if (error) throw error;
  return (data as { station_id: string }[]).map((w) => w.station_id);
}

export async function setWatch(stationId: string, on: boolean) {
  if (!supabase) throw new Error('offline');
  const { error } = on
    ? await supabase.from('wasla_watches').upsert({ station_id: stationId })
    : await supabase.from('wasla_watches').delete().eq('station_id', stationId);
  if (error) throw error;
}

export async function savePushToken(token: string) {
  if (!supabase) return;
  await supabase.from('wasla_push_tokens').upsert({ token, platform: Platform.OS });
}

// ---------- الحساب ----------

export async function sendOtp(localPhone: string) {
  if (!supabase) throw new Error('offline');
  const { error } = await supabase.auth.signInWithOtp({ phone: toE164(localPhone) });
  if (error) throw error;
}

export async function verifyOtp(localPhone: string, code: string) {
  if (!supabase) throw new Error('offline');
  const { data, error } = await supabase.auth.verifyOtp({ phone: toE164(localPhone), token: code, type: 'sms' });
  if (error) throw error;
  return data.user;
}

export async function signOutRemote() {
  await supabase?.auth.signOut();
}

/** رسالة خطأ مفهومة للمستخدم */
export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/استنى شوية/.test(msg)) return 'استنى شوية قبل ما تبلّغ تاني عن نفس المحطة';
  if (/rate|too many/i.test(msg)) return 'محاولات كتير، جرّب بعد شوية';
  if (/expired|invalid/i.test(msg)) return 'الكود غلط أو خلص، اطلب كود جديد';
  if (/network|fetch/i.test(msg)) return 'مفيش إنترنت، جرّب تاني';
  return 'حصلت مشكلة، جرّب تاني';
}
