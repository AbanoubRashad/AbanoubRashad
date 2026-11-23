// منسوخ تلقائي من app/src/domain — متعدلش هنا، عدّل في التطبيق وشغّل npm run sync:functions
import type { CheckIn, Connector, Station, StationStatus } from './types.ts';

const MIN = 60_000;
const HOUR = 60 * MIN;

/** بلاغ «شغّال» بيفضل صالح 3 ساعات */
export const OK_TTL = 3 * HOUR;
/** بلاغ «طابور» بيفضل صالح ساعة بس */
export const QUEUE_TTL = 1 * HOUR;
/** بلاغات «بايظ» بتتجمع في 6 ساعات */
export const BROKEN_TTL = 6 * HOUR;
/** محتاجين سواقين مختلفين يأكدوا إنه بايظ علشان يتعلّم «بايظ» للكل */
export const BROKEN_CONFIRMATIONS = 2;

export interface StationState {
  status: StationStatus;
  /** آخر بلاغ أثّر على الحالة */
  lastAt: number | null;
  /** عدد السواقين المختلفين اللي أكدوا في آخر 24 ساعة */
  confirmationsToday: number;
  /** حالة كل شاحن (لو في بلاغات عليه) */
  plugs: Record<string, PlugState>;
}

export interface PlugState {
  status: 'free' | 'busy' | 'broken' | 'unknown';
  lastAt: number | null;
}

function recent(checkIns: CheckIn[], now: number, ttl: number) {
  return checkIns.filter((c) => now - c.at >= 0 && now - c.at <= ttl);
}

/**
 * يحسب حالة المحطة من بلاغات السواقين.
 *
 * القواعد:
 * - بلاغين «بايظ» من سواقين مختلفين في 6 ساعات، ومفيش «شغّال» بعدهم → بايظ.
 * - بلاغ «بايظ» واحد بس:
 *     - لو في «شغّال» حديث قبله أو بعده → متضارب (أصفر).
 *     - غير كده → متضارب برضه، لأن مفيش حد أكد.
 * - «شغّال» في آخر 3 ساعات → شغّال، إلا لو آخر بلاغ في آخر ساعة كان «طابور» → طابور.
 * - مفيش حاجة حديثة → مفيش تأكيد (رمادي).
 */
export function computeStationState(stationCheckIns: CheckIn[], now: number): StationState {
  const sorted = [...stationCheckIns].filter((c) => c.at <= now).sort((a, b) => b.at - a.at);

  const brokenRecent = recent(sorted, now, BROKEN_TTL).filter((c) => c.kind === 'broken');
  const okRecent = recent(sorted, now, OK_TTL).filter((c) => c.kind === 'ok');
  const queueRecent = recent(sorted, now, QUEUE_TTL).filter((c) => c.kind === 'queue');

  const latestOk = okRecent[0]?.at ?? null;
  // بلاغات «بايظ» اللي جت بعد آخر «شغّال» بس هي اللي تتحسب
  const brokenAfterOk = brokenRecent.filter((c) => latestOk === null || c.at > latestOk);
  const brokenUsers = new Set(brokenAfterOk.map((c) => c.userId));

  let status: StationStatus = 'unknown';
  let lastAt: number | null = null;

  if (brokenUsers.size >= BROKEN_CONFIRMATIONS) {
    status = 'broken';
    lastAt = brokenAfterOk[0].at;
  } else if (brokenUsers.size === 1) {
    status = 'conflict';
    lastAt = brokenAfterOk[0].at;
  } else if (queueRecent.length > 0 && (latestOk === null || queueRecent[0].at > latestOk)) {
    status = 'queue';
    lastAt = queueRecent[0].at;
  } else if (latestOk !== null) {
    status = 'working';
    lastAt = latestOk;
  } else {
    lastAt = sorted[0]?.at ?? null;
  }

  const dayUsers = new Set(recent(sorted, now, 24 * HOUR).map((c) => c.userId));

  return { status, lastAt, confirmationsToday: dayUsers.size, plugs: computePlugStates(sorted, now) };
}

/** شاحن اتبلّغ عليه «شغّال» في آخر 45 دقيقة يعتبر مشغول (حد بيشحن عليه)، بعدها يرجع فاضي */
export const CHARGING_SESSION = 45 * MIN;

function computePlugStates(sortedDesc: CheckIn[], now: number): Record<string, PlugState> {
  const out: Record<string, PlugState> = {};
  for (const c of sortedDesc) {
    if (!c.plugId || out[c.plugId]) continue;
    const age = now - c.at;
    let status: PlugState['status'] = 'unknown';
    if (c.kind === 'broken' && age <= BROKEN_TTL) status = 'broken';
    else if (c.kind === 'ok' && age <= CHARGING_SESSION) status = 'busy';
    else if (c.kind === 'ok' && age <= OK_TTL) status = 'free';
    else if (c.kind === 'queue' && age <= QUEUE_TTL) status = 'busy';
    out[c.plugId] = { status, lastAt: c.at };
  }
  return out;
}

/** عدد الشواحن الفاضية المعروفة (للرقم الكبير «2/3») */
export function freePlugCount(station: Station, state: StationState): number | null {
  if (station.plugs.length === 0) return null;
  if (state.status === 'broken' || state.status === 'unknown') return state.status === 'broken' ? 0 : null;
  if (state.status === 'queue') return 0;
  return station.plugs.filter((p) => {
    const ps = state.plugs[p.id];
    return !ps || ps.status === 'free' || ps.status === 'unknown';
  }).length;
}

/**
 * شريط التاريخ: آخر N ساعة، كل خانة بلون أغلب حالة اتبلّغت فيها.
 * null = مفيش بلاغات في الساعة دي.
 */
export function statusHistory(stationCheckIns: CheckIn[], now: number, hours = 12): (StationStatus | null)[] {
  const buckets: (StationStatus | null)[] = [];
  for (let i = hours - 1; i >= 0; i--) {
    const from = now - (i + 1) * HOUR;
    const to = now - i * HOUR;
    const inBucket = stationCheckIns.filter((c) => c.at > from && c.at <= to);
    if (inBucket.length === 0) {
      buckets.push(null);
      continue;
    }
    const counts = { ok: 0, broken: 0, queue: 0 };
    for (const c of inBucket) counts[c.kind]++;
    const top = (Object.keys(counts) as (keyof typeof counts)[]).sort((a, b) => counts[b] - counts[a])[0];
    buckets.push(top === 'ok' ? 'working' : top === 'broken' ? 'broken' : 'queue');
  }
  return buckets;
}

export function historySummary(history: (StationStatus | null)[]): string {
  const ok = history.filter((h) => h === 'working').length;
  const q = history.filter((h) => h === 'queue').length;
  const b = history.filter((h) => h === 'broken').length;
  const parts: string[] = [];
  if (ok) parts.push(`${countWord(ok, 'مرة', 'مرتين', 'مرات')} شغّال`);
  if (q) parts.push(`${countWord(q, 'مرة', 'مرتين', 'مرات')} طابور`);
  if (b) parts.push(`${countWord(b, 'مرة', 'مرتين', 'مرات')} بايظ`);
  return parts.length ? parts.join('، ') : 'مفيش بلاغات';
}

function countWord(n: number, one: string, two: string, many: string) {
  if (n === 1) return one;
  if (n === 2) return two;
  return `${n} ${many}`;
}

export function statusLabel(s: StationStatus): string {
  return { working: 'شغّال', broken: 'بايظ', queue: 'طابور', conflict: 'متضارب', unknown: 'مفيش تأكيد' }[s];
}

/** «من 12 دقيقة»، «من ساعتين»، «من ثواني» */
export function ago(at: number | null, now: number): string {
  if (at === null) return '';
  const m = Math.floor((now - at) / MIN);
  if (m < 1) return 'من ثواني';
  if (m === 1) return 'من دقيقة';
  if (m === 2) return 'من دقيقتين';
  if (m < 60) return `من ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h === 1) return 'من ساعة';
  if (h === 2) return 'من ساعتين';
  if (h < 24) return `من ${h} ساعات`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'من يوم' : d === 2 ? 'من يومين' : `من ${d} أيام`;
}

/** المسافة بالكيلومتر (هافرساين) */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** تقدير وقت السواقة بالدقايق: 40 كم/س جوه المدينة تقريبًا، 90 على الطريق */
export function etaMinutes(km: number): number {
  const speed = km > 15 ? 90 : 40;
  return Math.max(1, Math.round((km / speed) * 60));
}

export interface StationFilters {
  connectors: Connector[];
  minKw: number;
  workingOnly: boolean;
  onRouteOnly: boolean;
}

export const defaultFilters: StationFilters = { connectors: [], minKw: 0, workingOnly: false, onRouteOnly: false };

export function matchesFilters(station: Station, state: StationState, f: StationFilters): boolean {
  if (f.workingOnly && state.status !== 'working') return false;
  if (f.onRouteOnly && !station.onHighway) return false;
  if (f.connectors.length > 0) {
    // محطة مش معروف فيها نوع الفيشة بتفضل ظاهرة، علشان البيانات لسه ناقصة
    if (station.plugs.length > 0 && !station.plugs.some((p) => f.connectors.includes(p.connector))) return false;
  }
  if (f.minKw > 0) {
    const known = station.plugs.filter((p) => p.kw !== null);
    if (known.length > 0 && !known.some((p) => (p.kw ?? 0) >= f.minKw)) return false;
  }
  return true;
}
