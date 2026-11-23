import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { seedStations } from '../data/stations';
import { computeStationState, defaultFilters, statusLabel, type StationFilters, type StationState } from '../domain/status';
import type { CheckIn, Connector, ReportKind, Station } from '../domain/types';
import * as backend from '../lib/backend';
import { initNotifications, notifyStationChange } from '../lib/notify';

const STORAGE_KEY = 'wasla-shahn/v1';
const KEEP_MS = 48 * 3600_000;

export interface User {
  id: string;
  phone: string;
  name: string | null;
}

export interface PendingStation {
  id: string;
  name: string;
  operator: string;
  connector: Connector;
  kw: number | null;
  count: number;
  lat: number;
  lng: number;
  at: number;
}

export interface FeedItem {
  id: string;
  stationId: string;
  text: string;
  kind: 'working' | 'broken' | 'queue' | 'conflict' | 'unknown';
  at: number;
}

interface Persisted {
  checkIns: CheckIn[];
  /** آخر نسخة من المحطات جت من السيرفر (علشان التطبيق يفتح من غير نت) */
  stations: Station[] | null;
  watching: string[];
  saved: string[];
  user: User | null;
  pending: PendingStation[];
  filters: StationFilters;
  feed: FeedItem[];
  deviceId: string;
  /** إحصائيات بلاغاتي، بتفضل حتى لو البلاغات القديمة اتمسحت */
  myReports: { id: string; stationId: string; kind: ReportKind; at: number }[];
}

const initial: Persisted = {
  checkIns: [],
  stations: null,
  watching: [],
  saved: [],
  user: null,
  pending: [],
  filters: defaultFilters,
  feed: [],
  deviceId: '',
  myReports: [],
};

export type Result = { ok: true } | { ok: false; error: string };

interface AppStore extends Omit<Persisted, 'stations'> {
  ready: boolean;
  now: number;
  remote: boolean;
  online: boolean;
  stations: Station[];
  stateOf: (stationId: string) => StationState;
  report: (stationId: string, kind: ReportKind, plugId: string | null, photoUri?: string | null) => Promise<Result>;
  toggleWatch: (stationId: string) => void;
  toggleSaved: (stationId: string) => void;
  sendCode: (phone: string) => Promise<Result>;
  confirmCode: (phone: string, code: string) => Promise<Result>;
  signOut: () => void;
  setFilters: (f: StationFilters) => void;
  addStation: (s: Omit<PendingStation, 'id' | 'at'>) => Promise<Result>;
  seedDemo: () => void;
  refresh: () => Promise<void>;
  points: number;
  myUserId: string;
}

const Ctx = createContext<AppStore | null>(null);

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function mergeCheckIns(a: CheckIn[], b: CheckIn[]) {
  const map = new Map<string, CheckIn>();
  for (const c of [...a, ...b]) map.set(c.id, c);
  const cutoff = Date.now() - KEEP_MS;
  return [...map.values()].filter((c) => c.at >= cutoff);
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Persisted>(initial);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(!backend.isRemote);
  const [now, setNow] = useState(() => Date.now());
  const prevStatus = useRef<Record<string, string>>({});

  // تحميل من الموبايل
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const parsed = raw ? (JSON.parse(raw) as Partial<Persisted>) : {};
        setData({ ...initial, ...parsed, deviceId: parsed.deviceId || uid() });
      })
      .catch(() => setData({ ...initial, deviceId: uid() }))
      .finally(() => setReady(true));
  }, []);

  // حفظ على الموبايل
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [data, ready]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // ---------- السيرفر ----------
  const refresh = useCallback(async () => {
    if (!backend.isRemote) return;
    try {
      const [stations, checkIns] = await Promise.all([backend.fetchStations(), backend.fetchRecentCheckIns()]);
      setData((d) => ({ ...d, stations: stations.length ? stations : d.stations, checkIns: mergeCheckIns(d.checkIns, checkIns) }));
      setNow(Date.now());
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    if (!ready || !backend.supabase) return;
    refresh();
    const unsub = backend.subscribeCheckIns((c) => {
      setData((d) => ({ ...d, checkIns: mergeCheckIns(d.checkIns, [c]) }));
      setNow(Date.now());
    });
    const t = setInterval(refresh, 5 * 60_000);

    // الحساب: الجلسة بتتحفظ وبترجع لوحدها
    const { data: sub } = backend.supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      setData((d) => ({
        ...d,
        user: u ? { id: u.id, phone: u.phone ? '0' + u.phone.replace(/^\+?20/, '') : d.user?.phone ?? '', name: d.user?.name ?? null } : null,
      }));
      if (u) backend.fetchWatches().then((w) => setData((d) => ({ ...d, watching: [...new Set([...d.watching, ...w])] }))).catch(() => {});
    });

    return () => {
      unsub();
      clearInterval(t);
      sub.subscription.unsubscribe();
    };
  }, [ready, refresh]);

  const stations = data.stations ?? seedStations;

  const states = useMemo(() => {
    const byStation: Record<string, CheckIn[]> = {};
    for (const c of data.checkIns) (byStation[c.stationId] ??= []).push(c);
    const out: Record<string, StationState> = {};
    for (const s of stations) out[s.id] = computeStationState(byStation[s.id] ?? [], now);
    return out;
  }, [data.checkIns, now, stations]);

  // تنبيهات: محطة بتراقبها غيّرت حالتها → فيد + إشعار
  useEffect(() => {
    if (!ready) return;
    const items: FeedItem[] = [];
    for (const s of stations) {
      const st = states[s.id].status;
      const before = prevStatus.current[s.id];
      if (before !== undefined && before !== st && data.watching.includes(s.id)) {
        const text = st === 'working' ? `${s.name} رجعت تشتغل` : `${s.name} بقت «${statusLabel(st)}»`;
        items.push({ id: uid(), stationId: s.id, kind: st, at: Date.now(), text });
        notifyStationChange(st === 'working' ? 'في شاحن شغّال دلوقتي' : 'تحديث من المحطة', text, s.id).catch(() => {});
      }
      prevStatus.current[s.id] = st;
    }
    if (items.length) setData((d) => ({ ...d, feed: [...items, ...d.feed].slice(0, 50) }));
  }, [states, ready, data.watching, stations]);

  const myUserId = data.user?.id || data.deviceId;

  const report = useCallback(
    async (stationId: string, kind: ReportKind, plugId: string | null, photoUri?: string | null): Promise<Result> => {
      const local: CheckIn = { id: 'local-' + uid(), stationId, plugId, kind, at: Date.now(), userId: myUserId, photoPath: photoUri ?? null };
      const mine = { id: local.id, stationId, kind, at: local.at };
      if (!backend.isRemote) {
        setNow(local.at);
        setData((d) => ({ ...d, checkIns: [...d.checkIns, local], myReports: [mine, ...d.myReports] }));
        return { ok: true };
      }
      // متفائل: يظهر فورًا، ولو السيرفر رفض نشيله
      setNow(local.at);
      setData((d) => ({ ...d, checkIns: [...d.checkIns, local] }));
      try {
        const saved = await backend.insertCheckIn({ stationId, plugId, kind, photoUri });
        setData((d) => ({
          ...d,
          checkIns: mergeCheckIns(d.checkIns.filter((c) => c.id !== local.id), [saved]),
          myReports: [{ ...mine, id: saved.id }, ...d.myReports],
        }));
        return { ok: true };
      } catch (e) {
        setData((d) => ({ ...d, checkIns: d.checkIns.filter((c) => c.id !== local.id) }));
        return { ok: false, error: backend.friendlyError(e) };
      }
    },
    [myUserId],
  );

  const toggleList = (key: 'watching' | 'saved') => (stationId: string) =>
    setData((d) => {
      const on = !d[key].includes(stationId);
      if (key === 'watching' && backend.isRemote && d.user) backend.setWatch(stationId, on).catch(() => {});
      if (key === 'watching' && on) initNotifications().catch(() => {});
      return { ...d, [key]: on ? [...d[key], stationId] : d[key].filter((x) => x !== stationId) };
    });

  const sendCode = useCallback(async (phone: string): Promise<Result> => {
    if (!backend.isRemote) return { ok: true }; // وضع محلي: أي كود 6 أرقام
    try {
      await backend.sendOtp(phone);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: backend.friendlyError(e) };
    }
  }, []);

  const confirmCode = useCallback(
    async (phone: string, code: string): Promise<Result> => {
      if (!backend.isRemote) {
        setData((d) => ({ ...d, user: { id: 'local-' + phone, phone, name: d.user?.name ?? null } }));
        return { ok: true };
      }
      try {
        await backend.verifyOtp(phone, code);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: backend.friendlyError(e) };
      }
    },
    [],
  );

  const addStation = useCallback(async (s: Omit<PendingStation, 'id' | 'at'>): Promise<Result> => {
    try {
      if (backend.isRemote) await backend.insertPendingStation(s);
      setData((d) => ({ ...d, pending: [{ ...s, id: uid(), at: Date.now() }, ...d.pending] }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: backend.friendlyError(e) };
    }
  }, []);

  const seedDemo = useCallback(() => {
    // بيانات تجريبية للعرض بس (على الموبايل ده بس، مش بتتبعت للسيرفر)
    const t = Date.now();
    const m = 60_000;
    const demo: CheckIn[] = [
      ...Array.from({ length: 9 }, (_, i) => ({ id: 'demo-' + uid(), stationId: 'infinity-smart-village', plugId: '01', kind: 'ok' as const, at: t - (i * 75 + 12) * m, userId: `demo-${i}` })),
      { id: 'demo-' + uid(), stationId: 'infinity-smart-village', plugId: '02', kind: 'ok', at: t - 18 * m, userId: 'demo-a' },
      { id: 'demo-' + uid(), stationId: 'infinity-smart-village', plugId: null, kind: 'queue', at: t - 400 * m, userId: 'demo-b' },
      { id: 'demo-' + uid(), stationId: 'shell-out-desert-october', plugId: null, kind: 'queue', at: t - 25 * m, userId: 'demo-c' },
      { id: 'demo-' + uid(), stationId: 'galleria-40', plugId: null, kind: 'broken', at: t - 120 * m, userId: 'demo-d' },
      { id: 'demo-' + uid(), stationId: 'galleria-40', plugId: null, kind: 'broken', at: t - 100 * m, userId: 'demo-e' },
      { id: 'demo-' + uid(), stationId: 'arkan-mall', plugId: null, kind: 'ok', at: t - 40 * m, userId: 'demo-f' },
    ];
    setNow(t);
    setData((d) => ({ ...d, checkIns: [...d.checkIns.filter((c) => !c.userId.startsWith('demo-')), ...demo] }));
  }, []);

  const value: AppStore = {
    ...data,
    ready,
    now,
    remote: backend.isRemote,
    online,
    stations,
    stateOf: (id) => states[id] ?? computeStationState([], now),
    report,
    toggleWatch: toggleList('watching'),
    toggleSaved: toggleList('saved'),
    sendCode,
    confirmCode,
    signOut: () => {
      backend.signOutRemote().catch(() => {});
      setData((d) => ({ ...d, user: null }));
    },
    setFilters: (filters) => setData((d) => ({ ...d, filters })),
    addStation,
    seedDemo,
    refresh,
    points: data.myReports.length * 10 + data.pending.length * 25,
    myUserId,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppStoreProvider');
  return v;
}

export function useStation(id: string | undefined) {
  const app = useApp();
  const station = app.stations.find((s) => s.id === id) ?? null;
  return { station, state: station ? app.stateOf(station.id) : null, app };
}
