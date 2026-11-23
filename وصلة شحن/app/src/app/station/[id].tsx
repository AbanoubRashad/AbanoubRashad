import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { HistoryBar } from '../../components/history-bar';
import { Bookmark, NavArrow } from '../../components/icons';
import { Pin } from '../../components/pin';
import { BackButton } from '../../components/screen';
import { Eyebrow, IconButton, StatusGlyph, T } from '../../components/ui';
import { distanceKm, freePlugCount, statusHistory, statusLabel } from '../../domain/status';
import { useMyLocation } from '../../lib/use-location';
import { useStation } from '../../store/app-store';
import { colors, statusColors, ltrRow } from '../../theme';

const plugLabel = { free: 'فاضي', busy: 'مشغول', broken: 'بايظ', unknown: 'مش معروف' } as const;

export default function StationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { station: s, state, app } = useStation(id);
  const insets = useSafeAreaInsets();
  const { pos } = useMyLocation();

  if (!s || !state) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
        <T w="bold" size={20}>
          المحطة دي مش موجودة
        </T>
        <BackButton />
      </View>
    );
  }

  const c = statusColors[state.status];
  const history = statusHistory(app.checkIns.filter((x) => x.stationId === s.id), app.now, 24);
  const saved = app.saved.includes(s.id);
  const km = distanceKm(pos, s);
  const confirmations = state.confirmationsToday;
  const openMaps = () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* هيدر الخريطة */}
        <View style={{ height: 170 + insets.top }}>
          <Svg width="100%" height="100%" viewBox="0 0 390 170" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
            <Rect width="390" height="170" fill="#0C1424" />
            <Rect x="20" y="20" width="90" height="56" rx="12" fill="#101A2C" />
            <Rect x="270" y="96" width="100" height="60" rx="12" fill="#101A2C" />
            <Rect x="140" y="110" width="70" height="50" rx="12" fill="#101A2C" />
            <Path d="M0 100H390M180 0V170M300 0V170" stroke={colors.map.street} strokeWidth={3} />
            <Path d="M-20 40C100 60 240 70 410 130" stroke={colors.map.road} strokeWidth={16} fill="none" />
            <Path d="M-20 40C100 60 240 70 410 130" stroke="#3B4F7A" strokeWidth={1} strokeDasharray="8 10" fill="none" />
            <Defs>
              <LinearGradient id="f" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.bg} stopOpacity={0} />
                <Stop offset="1" stopColor={colors.bg} />
              </LinearGradient>
            </Defs>
            <Rect y="110" width="390" height="60" fill="url(#f)" />
          </Svg>
          <View style={{ position: 'absolute', top: insets.top + 56, alignSelf: 'center' }}>
            <Pin pin={{ id: s.id, lat: s.lat, lng: s.lng, status: state.status, free: freePlugCount(s, state) }} selected />
          </View>
          <View style={[styles.headerBtns, { top: insets.top + 14 }]}>
            <BackButton bg="rgba(15,23,40,0.92)" />
            <IconButton label={saved ? 'شيل من المحفوظ' : 'حفظ'} bg="rgba(15,23,40,0.92)" onPress={() => app.toggleSaved(s.id)}>
              <Bookmark filled={saved} color={saved ? colors.brand : colors.text} />
            </IconButton>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 20 }}>
          <View style={{ gap: 6 }}>
            <Eyebrow style={{ alignSelf: 'flex-end' }}>{`${s.operator === 'غير معروف' ? 'OPERATOR ?' : s.operator.toUpperCase()}${s.hours ? ' · ' + s.hours : ''}`}</Eyebrow>
            <T w="bold" size={26} style={{ textAlign: 'right', lineHeight: 36 }}>
              {s.name}
            </T>
            <T size={13} color={colors.textDim} style={{ textAlign: 'right' }}>
              {[s.notes, `${s.area} · ${km.toFixed(1)} كم`].filter(Boolean).join(' · ')}
            </T>
            {s.approximate && (
              <T size={12} color={statusColors.queue.text} style={{ textAlign: 'right' }}>
                مكانها على الخريطة تقريبي لحد ما حد يأكده
              </T>
            )}
          </View>

          {/* الحالة */}
          <View style={[styles.card, { gap: 12 }]}>
            <View style={styles.between}>
              <View style={[styles.statusPill, { backgroundColor: c.tint }]}>
                <View style={[styles.statusIcon, { backgroundColor: c.fill }]}>
                  <StatusGlyph status={state.status} size={14} />
                </View>
                <T w="bold" size={16} color={c.text}>
                  {state.status === 'working' ? 'شغّال دلوقتي' : statusLabel(state.status)}
                </T>
              </View>
              <T size={12} color={colors.textDim}>
                {confirmations === 0 ? 'محدش أكد النهارده' : confirmations === 1 ? 'سواق واحد أكد النهارده' : `${confirmations} سواقين أكدوا النهارده`}
              </T>
            </View>
            <HistoryBar history={history} height={14} />
            <View style={[styles.between, ltrRow]}>
              <T latin size={10} color={colors.textFaint}>
                -24h
              </T>
              <T latin size={10} color={colors.textFaint}>
                -12h
              </T>
              <T latin size={10} color={colors.textFaint}>
                NOW
              </T>
            </View>
          </View>

          {/* الشواحن */}
          {s.plugs.length > 0 ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {s.plugs.map((p) => {
                const ps = state.plugs[p.id]?.status ?? (state.status === 'working' ? 'free' : 'unknown');
                const col = ps === 'free' ? statusColors.working : ps === 'broken' ? statusColors.broken : ps === 'busy' ? statusColors.queue : statusColors.unknown;
                return (
                  <View key={p.id} style={[styles.plug, { borderColor: ps === 'free' ? col.fill + '55' : 'transparent' }]}>
                    <T latin size={11} color={colors.textDim}>
                      {`${p.id} · ${p.connector.toUpperCase()}`}
                    </T>
                    <T latin w="bold" size={24}>
                      {p.kw === null ? '?' : String(p.kw)}
                      <T latin size={12} color={colors.textDim}>
                        {' kW'}
                      </T>
                    </T>
                    <T w="semibold" size={12} color={col.text}>
                      {plugLabel[ps]}
                    </T>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.card}>
              <T size={14} color={colors.textMuted} style={{ textAlign: 'right' }}>
                لسه مش عارفين عدد الشواحن ونوع الفيش هنا. لو عديت عليها بلّغ وقولنا.
              </T>
            </View>
          )}

          {/* معلومات */}
          <View style={styles.card}>
            <Fact k="السعر" v={s.price ?? 'مش معروف لسه'} />
            <Fact k="المواعيد" v={s.hours ?? 'مش معروفة لسه'} />
            {s.nearby.length > 0 && <Fact k="جنبها" v={s.nearby.join(' · ')} />}
            <Fact k="المصدر" v={s.source} latin />
            <Pressable accessibilityRole="link" onPress={openMaps} style={styles.fact}>
              <T size={13} color={colors.textDim}>
                الخريطة
              </T>
              <T w="semibold" size={14} color={colors.brand}>
                افتح في Google Maps ↗
              </T>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(app.user ? { pathname: '/checkin/[id]', params: { id: s.id } } : { pathname: '/login', params: { next: `/checkin/${s.id}` } })}
          style={[styles.footerBtn, { backgroundColor: colors.text }]}
        >
          <T w="bold" size={16} color={colors.bg}>
            أنا هنا · بلّغ
          </T>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/navigate/[id]', params: { id: s.id } })}
          style={[styles.footerBtn, { backgroundColor: colors.brand, flexDirection: 'row', gap: 8 }]}
        >
          <NavArrow />
          <T w="bold" size={16} color={colors.brandInk}>
            وديني
          </T>
        </Pressable>
      </View>
    </View>
  );
}

function Fact({ k, v, latin }: { k: string; v: string; latin?: boolean }) {
  return (
    <View style={styles.fact}>
      <T size={13} color={colors.textDim}>
        {k}
      </T>
      <T latin={latin} size={14} style={{ flexShrink: 1, textAlign: 'left' }}>
        {v}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerBtns: { position: 'absolute', right: 14, left: 14, flexDirection: 'row', justifyContent: 'space-between' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { padding: 16, borderRadius: 22, backgroundColor: colors.surface },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingStart: 4, paddingEnd: 12, height: 36, borderRadius: 18 },
  statusIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  plug: { flex: 1, padding: 12, borderRadius: 18, backgroundColor: colors.surface, gap: 4, borderWidth: 1.5 },
  fact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, gap: 12 },
  footer: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 10, backgroundColor: colors.bg },
  footerBtn: { flex: 1, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
