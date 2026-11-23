import { Link, router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HistoryBar } from '../components/history-bar';
import { Bell, FilterIcon, Logo, NavArrow, Search } from '../components/icons';
import { StationMap } from '../components/station-map';
import type { MapPin } from '../components/station-map.types';
import { Chip, Eyebrow, IconButton, StatusDot, StatusGlyph, T } from '../components/ui';
import { ago, distanceKm, etaMinutes, freePlugCount, historySummary, matchesFilters, statusHistory, statusLabel } from '../domain/status';
import { useMyLocation } from '../lib/use-location';
import { useApp } from '../store/app-store';
import { colors, fonts, statusColors, ltrRow } from '../theme';

export default function MapScreen() {
  const app = useApp();
  const insets = useSafeAreaInsets();
  const { pos } = useMyLocation();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recenter, setRecenter] = useState(0);

  const list = useMemo(() => {
    const q = query.trim();
    return app.stations
      .map((s) => {
        const state = app.stateOf(s.id);
        const km = distanceKm(pos, s);
        return { s, state, km };
      })
      .filter(({ s, state }) => matchesFilters(s, state, app.filters))
      .filter(({ s }) => !q || s.name.includes(q) || s.operator.toLowerCase().includes(q.toLowerCase()) || s.area.includes(q))
      .sort((a, b) => a.km - b.km);
  }, [app, pos, query]);

  const pins: MapPin[] = useMemo(
    () => list.map(({ s, state }) => ({ id: s.id, lat: s.lat, lng: s.lng, status: state.status, free: freePlugCount(s, state) })),
    [list],
  );

  const focus = list.find((x) => x.s.id === selectedId) ?? list[0] ?? null;
  const others = list.filter((x) => x !== focus).slice(0, 2);
  const onSelect = useCallback((id: string) => setSelectedId(id), []);

  const f = app.filters;
  const filterLabel = f.connectors.length || f.minKw ? `${f.connectors.join(' · ') || 'كل الفيش'}${f.minKw ? ` · ${f.minKw}+` : ''}` : 'الفلاتر';

  const myInitial = app.user?.name?.[0] ?? (app.user ? 'أ' : null);

  return (
    <View style={styles.root}>
      <StationMap
        pins={pins}
        me={pos}
        selectedId={focus?.s.id ?? null}
        onSelect={onSelect}
        recenterKey={recenter}
        style={StyleSheet.absoluteFill}
        bottomInset={360}
      />

      {/* فوق */}
      <View style={[styles.top, { top: insets.top + 14 }]}>
        <View style={styles.row}>
          <View style={styles.search}>
            <Logo size={26} />
            <TextInput
              accessibilityLabel="ابحث عن محطة"
              placeholder="رايح فين؟"
              placeholderTextColor={colors.textDim}
              value={query}
              onChangeText={setQuery}
              style={styles.input}
            />
            <Search />
          </View>
          <Link href={app.user ? '/profile' : '/login'} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="بروفايلي" style={styles.avatar}>
              {myInitial ? (
                <T w="bold" size={16}>
                  {myInitial}
                </T>
              ) : (
                <T w="semibold" size={12} color={colors.textSoft}>
                  دخول
                </T>
              )}
            </Pressable>
          </Link>
        </View>
        <View style={[styles.row, { gap: 6 }]}>
          <Link href="/filters" asChild>
            <Pressable accessibilityRole="button" style={styles.filterChip}>
              <FilterIcon />
              <T latin={!!(f.connectors.length || f.minKw)} w="semibold" size={13} color={colors.bg}>
                {filterLabel}
              </T>
            </Pressable>
          </Link>
          <Chip label="شغّال بس" active={f.workingOnly} onPress={() => app.setFilters({ ...f, workingOnly: !f.workingOnly })} />
          <Chip label="على الطريق" active={f.onRouteOnly} onPress={() => app.setFilters({ ...f, onRouteOnly: !f.onRouteOnly })} />
        </View>
        {app.remote && !app.online && (
          <Pressable accessibilityRole="button" onPress={app.refresh} style={styles.offline}>
            <T size={12} color={colors.textSoft}>
              مفيش اتصال · بنعرض آخر بيانات عندك · اضغط تحدّث
            </T>
          </Pressable>
        )}
      </View>

      <IconButton label="رجّعني لمكاني" size={48} bg={colors.surfaceGlass} onPress={() => setRecenter((n) => n + 1)} style={[styles.recenter]}>
        <NavArrow size={20} color={colors.brand} />
      </IconButton>

      {/* الشيت */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 22 }]}>
        <View style={styles.grabber} />
        {focus ? (
          <FocusCard item={focus} now={app.now} />
        ) : (
          <View style={{ paddingVertical: 24, alignItems: 'center', gap: 6 }}>
            <T w="bold" size={17}>
              مفيش محطات بالفلاتر دي
            </T>
            <Pressable onPress={() => app.setFilters({ connectors: [], minKw: 0, workingOnly: false, onRouteOnly: false })}>
              <T color={colors.brand}>امسح الفلاتر</T>
            </Pressable>
          </View>
        )}

        {others.length > 0 && (
          <View>
            {others.map(({ s, state, km }) => (
              <Pressable key={s.id} accessibilityRole="button" onPress={() => setSelectedId(s.id)} style={styles.listRow}>
                <StatusDot status={state.status} />
                <T w="medium" size={15} style={{ flex: 1, textAlign: 'right' }} numberOfLines={1}>
                  {s.name}
                </T>
                <T size={12} color={statusColors[state.status].text}>
                  {statusLabel(state.status)}
                  {state.status !== 'unknown' && state.lastAt ? ` · ${ago(state.lastAt, app.now).replace('من ', '')}` : ''}
                </T>
                <T latin size={13} color={colors.textDim} style={{ minWidth: 56, textAlign: 'left' }}>
                  {km.toFixed(1)} km
                </T>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function FocusCard({ item, now }: { item: { s: ReturnType<typeof useApp>['stations'][number]; state: ReturnType<ReturnType<typeof useApp>['stateOf']>; km: number }; now: number }) {
  const app = useApp();
  const { s, state, km } = item;
  const free = freePlugCount(s, state);
  const c = statusColors[state.status];
  const history = statusHistory(
    app.checkIns.filter((x) => x.stationId === s.id),
    now,
    12,
  );
  const statusLine =
    state.status === 'unknown'
      ? 'مفيش تأكيد لسه · كن أول واحد يبلّغ'
      : `${statusLabel(state.status)} · ${state.status === 'broken' ? 'أكدها سواقين' : 'أكدها سواق'} ${ago(state.lastAt, now)}`;

  return (
    <>
      <Link href={{ pathname: '/station/[id]', params: { id: s.id } }} asChild>
        <Pressable accessibilityRole="button" style={{ gap: 14 }}>
          <View style={styles.between}>
            <T size={12} color={colors.textDim}>
              الأقرب ليك
            </T>
            <Eyebrow>
              {`${s.operator === 'غير معروف' ? 'OPERATOR ?' : s.operator.toUpperCase()} · ${km.toFixed(1)} KM · ${etaMinutes(km)} MIN`}
            </Eyebrow>
          </View>
          <View style={[styles.between, { alignItems: 'flex-end', gap: 12 }]}>
            <View style={{ gap: 6, flex: 1 }}>
              <T w="bold" size={22} style={{ lineHeight: 30, textAlign: 'right' }}>
                {s.name}
              </T>
              <View style={[styles.row, { gap: 6 }]}>
                <StatusGlyph status={state.status} size={14} color={c.text} />
                <T w="semibold" size={13} color={c.text}>
                  {statusLine}
                </T>
              </View>
            </View>
            <View style={{ alignItems: 'flex-start' }}>
              {s.plugs.length > 0 ? (
                <View style={{ ...ltrRow, alignItems: 'baseline' }}>
                  <T latin w="bold" size={52} style={{ lineHeight: 52, letterSpacing: -2 }}>
                    {free === null ? '–' : String(free)}
                  </T>
                  <T latin w="bold" size={24} color={colors.textFaint}>
                    /{s.plugs.length}
                  </T>
                </View>
              ) : (
                <T latin w="bold" size={40} color={colors.textFaint}>
                  ?
                </T>
              )}
              <T size={12} color={colors.textDim}>
                {s.plugs.length ? 'شاحن فاضي' : 'عدد الشواحن مش معروف'}
              </T>
            </View>
          </View>
          <View style={{ gap: 6 }}>
            <HistoryBar history={history} />
            <T size={11} color={colors.textDim}>
              آخر 12 ساعة · {historySummary(history)}
            </T>
          </View>
        </Pressable>
      </Link>

      <View style={[styles.row, { gap: 8 }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/navigate/[id]', params: { id: s.id } })}
          style={({ pressed }) => [styles.go, { opacity: pressed ? 0.85 : 1 }]}
        >
          <NavArrow />
          <T w="bold" size={16} color={colors.brandInk}>
            وديني هناك
          </T>
        </Pressable>
        <IconButton
          label={app.watching.includes(s.id) ? 'بطّل تنبيه' : 'نبهني'}
          size={52}
          bg={app.watching.includes(s.id) ? colors.brandTint : colors.raised}
          style={{ borderRadius: 16 }}
          onPress={() => {
            if (!app.watching.includes(s.id)) app.toggleWatch(s.id);
            router.push('/alerts');
          }}
        >
          <Bell color={app.watching.includes(s.id) ? colors.brand : colors.text} />
        </IconButton>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { position: 'absolute', right: 14, left: 14, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  search: {
    flex: 1,
    height: 52,
    paddingStart: 16,
    paddingEnd: 14,
    borderRadius: 26,
    backgroundColor: colors.surfaceGlass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginEnd: 8,
  },
  input: { flex: 1, minWidth: 0, color: colors.text, fontFamily: fonts.regular, fontSize: 16, textAlign: 'right', paddingVertical: 0 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surfaceGlass, alignItems: 'center', justifyContent: 'center' },
  filterChip: { height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: colors.text, flexDirection: 'row', alignItems: 'center', gap: 6 },
  offline: { alignSelf: 'flex-start', height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: 'rgba(42,33,16,0.95)', justifyContent: 'center' },
  recenter: { position: 'absolute', bottom: 392, left: 14 },
  sheet: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: colors.sheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    paddingHorizontal: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#2A3654', alignSelf: 'center' },
  go: { flex: 1, height: 52, borderRadius: 16, backgroundColor: colors.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginEnd: 8 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line },
});
