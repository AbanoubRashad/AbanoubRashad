import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { seedStations } from '../data/stations';
import { computeStationState, defaultFilters, statusLabel, type StationFilters, type StationState } from '../domain/status';
import type { CheckIn, Connector, ReportKind, Station } from '../domain/types';

const STORAGE_KEY = 'wasla-shahn/v1';

export interface User {
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
  watching: string[];
  saved: string[];
  user: User | null;
  pending: PendingStation[];
  filters: StationFilters;
  feed: FeedItem[];
  deviceId: string;
}

const initial: Persisted = {
  checkIns: [],
  watching: [],
  saved: [],
  user: null,
  pending: [],
  filters: defaultFilters,
  feed: [],
  deviceId: '',
};

interface AppStore extends Persisted {
  ready: boolean;
  now: number;
  stations: Station[];
  stateOf: (stationId: string) => StationState;
  report: (stationId: string, kind: ReportKind, plugId: string | null) => void;
  toggleWatch: (stationId: string) => void;
  toggleSaved: (stationId: string) => void;
  signIn: (phone: string) => void;
  signOut: () => void;
  setFilters: (f: StationFilters) => void;
  addStation: (s: Omit<PendingStation, 'id' | 'at'>) => void;
  seedDemo: () => void;
  points: number;
}

const Ctx = createContext<AppStore | null>(null);

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Persisted>(initial);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const prevStatus = useRef<Record<string, string>>({});

  // تحميل
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        const parsed = raw ? (JSON.parse(raw) as Partial<Persisted>) : {};
        setData({ ...initial, ...parsed, deviceId: parsed.deviceId || uid() });
      })
      .catch(() => setData({ ...initial, deviceId: uid() }))
      .finally(() => setReady(true));
  }, []);

  // حفظ
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [data, ready]);

  // الحالات بتتغير مع الوقت (بلاغ بيقدم)، فبنحدّث كل دقيقة
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const states = useMemo(() => {
    const byStation: Record<string, CheckIn[]> = {};
    for (const c of data.checkIns) (byStation[c.stationId] ??= []).push(c);
    const out: Record<string, StationState> = {};
    for (const s of seedStations) out[s.id] = computeStationState(byStation[s.id] ?? [], now);
    return out;
  }, [data.checkIns, now]);

  // تنبيهات: لما محطة متراقبة تغيّر حالتها نضيفها للفيد
  useEffect(() => {
    if (!ready) return;
    const items: FeedItem[] = [];
    for (const s of seedStations) {
      const st = states[s.id].status;
      const before = prevStatus.current[s.id];
      if (before !== undefined && before !== st && data.watching.includes(s.id)) {
        items.push({ id: uid(), stationId: s.id, kind: st, at: Date.now(), text: `${s.name} بقت «${statusLabel(st)}»` });
      }
      prevStatus.current[s.id] = st;
    }
    if (items.length) setData((d) => ({ ...d, feed: [...items, ...d.feed].slice(0, 50) }));
  }, [states, ready, data.watching]);

  const userId = data.user?.phone || data.deviceId;

  const report = useCallback(
    (stationId: string, kind: ReportKind, plugId: string | null) => {
      const c: CheckIn = { id: uid(), stationId, plugId, kind, at: Date.now(), userId };
      setNow(c.at);
      setData((d) => ({ ...d, checkIns: [...d.checkIns, c] }));
    },
    [userId],
  );

  const toggle = (key: 'watching' | 'saved') => (stationId: string) =>
    setData((d) => ({
      ...d,
      [key]: d[key].includes(stationId) ? d[key].filter((x) => x !== stationId) : [...d[key], stationId],
    }));

  const seedDemo = useCallback(() => {
    // بيانات تجريبية للعرض بس — بتتعلّم بمستخدمين demo-*
    const t = Date.now();
    const m = 60_000;
    const demo: CheckIn[] = [
      ...Array.from({ length: 9 }, (_, i) => ({ id: uid(), stationId: 'infinity-smart-village', plugId: '01', kind: 'ok' as const, at: t - (i * 75 + 12) * m, userId: `demo-${i}` })),
      { id: uid(), stationId: 'infinity-smart-village', plugId: '02', kind: 'ok', at: t - 18 * m, userId: 'demo-a' },
      { id: uid(), stationId: 'infinity-smart-village', plugId: null, kind: 'queue', at: t - 400 * m, userId: 'demo-b' },
      { id: uid(), stationId: 'shell-out-desert-october', plugId: null, kind: 'queue', at: t - 25 * m, userId: 'demo-c' },
      { id: uid(), stationId: 'galleria-40', plugId: null, kind: 'broken', at: t - 120 * m, userId: 'demo-d' },
      { id: uid(), stationId: 'galleria-40', plugId: null, kind: 'broken', at: t - 100 * m, userId: 'demo-e' },
      { id: uid(), stationId: 'arkan-mall', plugId: null, kind: 'ok', at: t - 40 * m, userId: 'demo-f' },
    ];
    setNow(t);
    setData((d) => ({ ...d, checkIns: [...d.checkIns.filter((c) => !c.userId.startsWith('demo-')), ...demo] }));
  }, []);

  const myReports = data.checkIns.filter((c) => c.userId === userId);

  const value: AppStore = {
    ...data,
    ready,
    now,
    stations: seedStations,
    stateOf: (id) => states[id] ?? computeStationState([], now),
    report,
    toggleWatch: toggle('watching'),
    toggleSaved: toggle('saved'),
    signIn: (phone) => setData((d) => ({ ...d, user: { phone, name: d.user?.name ?? null } })),
    signOut: () => setData((d) => ({ ...d, user: null })),
    setFilters: (filters) => setData((d) => ({ ...d, filters })),
    addStation: (s) => setData((d) => ({ ...d, pending: [{ ...s, id: uid(), at: Date.now() }, ...d.pending] })),
    seedDemo,
    points: myReports.length * 10 + data.pending.length * 25,
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
