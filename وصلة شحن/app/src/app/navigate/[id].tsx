import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NavArrow } from '../../components/icons';
import { BackButton } from '../../components/screen';
import { StationMap } from '../../components/station-map';
import { StatusGlyph, T } from '../../components/ui';
import { ago, distanceKm, etaMinutes, freePlugCount, statusLabel } from '../../domain/status';
import { useMyLocation } from '../../lib/use-location';
import { useStation } from '../../store/app-store';
import { colors, statusColors } from '../../theme';

/** لما تبقى أقرب من كده نعتبرك وصلت */
const ARRIVED_KM = 0.15;

export default function NavigateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { station: s, state, app } = useStation(id);
  const insets = useSafeAreaInsets();
  const { pos, granted } = useMyLocation();
  const [started, setStarted] = useState(false);

  const pins = useMemo(
    () => (s && state ? [{ id: s.id, lat: s.lat, lng: s.lng, status: state.status, free: freePlugCount(s, state) }] : []),
    [s, state],
  );

  if (!s || !state) return null;

  const km = distanceKm(pos, s);
  const arrived = granted === true && km <= ARRIVED_KM;
  const free = freePlugCount(s, state);
  const c = statusColors[state.status];

  // التوجيه خطوة بخطوة بيتعمل في جوجل ماب، وإحنا بنفضل نراقب المحطة
  const openTurnByTurn = () => {
    setStarted(true);
    const dest = `${s.lat},${s.lng}`;
    const url =
      Platform.OS === 'android'
        ? `google.navigation:q=${dest}&mode=d`
        : Platform.OS === 'ios'
          ? `comgooglemaps://?daddr=${dest}&directionsmode=driving`
          : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`));
  };

  const liveLine =
    state.status === 'unknown'
      ? 'مفيش بلاغات حديثة عن المحطة دي'
      : state.status === 'working' && free !== null
        ? `${free} شاحن فاضي`
        : statusLabel(state.status);

  return (
    <View style={styles.root}>
      <StationMap pins={pins} me={pos} selectedId={s.id} onSelect={() => {}} recenterKey={0} style={StyleSheet.absoluteFill} bottomInset={300} />

      <View style={[styles.top, { top: insets.top + 14 }]}>
        <BackButton bg="rgba(15,23,40,0.92)" />
        <View style={styles.topTitle}>
          <T w="semibold" size={14} numberOfLines={1}>
            {`من مكانك ← ${s.name}`}
          </T>
        </View>
      </View>

      {/* تحذير لو الحالة اتغيرت للأسوأ وإنت في الطريق */}
      {started && (state.status === 'broken' || state.status === 'queue' || state.status === 'conflict') && (
        <View style={[styles.toast, { top: insets.top + 72 }]}>
          <View style={[styles.toastIcon, { backgroundColor: c.fill }]}>
            <StatusGlyph status={state.status} size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <T w="bold" size={14} style={{ textAlign: 'right' }}>
              تحديث لايف من المحطة
            </T>
            <T size={12} color={colors.textMuted} style={{ textAlign: 'right' }}>
              {`المحطة دلوقتي «${statusLabel(state.status)}» · ${ago(state.lastAt, app.now)}. شوف محطة تانية؟`}
            </T>
          </View>
        </View>
      )}

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 22 }]}>
        <View style={styles.grabber} />
        {arrived ? (
          <View style={{ alignItems: 'center', gap: 10 }}>
            <View style={[styles.arrived, { backgroundColor: statusColors.working.fill }]}>
              <StatusGlyph status="working" size={34} />
            </View>
            <T w="bold" size={24}>
              وصلت!
            </T>
            <T size={14} color={colors.textMuted} style={{ textAlign: 'center' }}>
              بعد ما تشحن قول للناس الوضع
            </T>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace({ pathname: '/checkin/[id]', params: { id: s.id } })}
              style={[styles.cta, { alignSelf: 'stretch' }]}
            >
              <T w="bold" size={16} color={colors.brandInk}>
                بلّغ عن الوضع
              </T>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.between}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <T latin w="bold" size={44} style={{ lineHeight: 48 }}>
                  {String(etaMinutes(km))}
                </T>
                <T size={14} color={colors.textDim}>
                  دقيقة
                </T>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T latin w="bold" size={18}>
                  {`${km.toFixed(1)} km`}
                </T>
                <T size={12} color={colors.textDim} numberOfLines={1}>
                  {`لحد ${s.name}`}
                </T>
              </View>
            </View>
            <View style={[styles.live, { backgroundColor: c.tint }]}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.fill }} />
              <T size={13} color={colors.textSoft} style={{ flex: 1, textAlign: 'right' }}>
                بنراقب المحطة لايف · <T w="bold" size={13} color={c.text}>{liveLine}</T>
              </T>
              <T size={12} color={colors.textDim}>
                {ago(state.lastAt, app.now)}
              </T>
            </View>
            {granted === false && (
              <T size={12} color={statusColors.queue.text} style={{ textAlign: 'right' }}>
                افتح الموقع علشان نحسب المسافة صح
              </T>
            )}
            <Pressable accessibilityRole="button" onPress={openTurnByTurn} style={styles.cta}>
              <NavArrow />
              <T w="bold" size={16} color={colors.brandInk}>
                {started ? 'افتح الاتجاهات تاني' : 'ابدأ الرحلة'}
              </T>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { position: 'absolute', right: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  topTitle: { flex: 1, height: 44, borderRadius: 22, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: 'rgba(15,23,40,0.92)' },
  toast: {
    position: 'absolute',
    right: 14,
    left: 14,
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(15,23,40,0.96)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toastIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sheet: { position: 'absolute', bottom: 0, right: 0, left: 0, backgroundColor: colors.sheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 8, paddingHorizontal: 18, gap: 14 },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#2A3654', alignSelf: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  live: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14 },
  cta: { height: 56, borderRadius: 18, backgroundColor: colors.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  arrived: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
});
