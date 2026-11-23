import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Camera } from '../../components/icons';
import { BackButton } from '../../components/screen';
import { IconButton, StatusGlyph, T } from '../../components/ui';
import { distanceKm } from '../../domain/status';
import type { ReportKind } from '../../domain/types';
import { useMyLocation } from '../../lib/use-location';
import { useStation } from '../../store/app-store';
import { colors, statusColors, type StationStatus, ltrRow } from '../../theme';

const OPTIONS: { kind: ReportKind; status: StationStatus; title: string; sub: string }[] = [
  { kind: 'ok', status: 'working', title: 'شحنت تمام', sub: 'الشاحن شغّال' },
  { kind: 'broken', status: 'broken', title: 'بايظ', sub: 'مش بيشحن، أو الشاشة واقفة، أو الكابل مقطوع' },
  { kind: 'queue', status: 'queue', title: 'في طابور', sub: 'كل الشواحن مشغولة' },
];

export default function CheckInScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { station: s, app } = useStation(id);
  const insets = useSafeAreaInsets();
  const { pos, granted } = useMyLocation();
  const [pick, setPick] = useState<ReportKind>('ok');
  const [plug, setPlug] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (!s) return null;

  const plugs = s.plugs;
  const chosenPlug = plug ?? plugs[0]?.id ?? null;
  const meters = Math.round(distanceKm(pos, s) * 1000);
  const near = granted && meters <= 300;

  const send = () => {
    app.report(s.id, pick, pick === 'queue' ? null : chosenPlug);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSent(true);
  };

  if (sent) return <Sent kind={pick} plugName={plugs.find((p) => p.id === chosenPlug)} onAgain={() => setSent(false)} />;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 22 }]}>
      <View style={styles.between}>
        <BackButton close />
        <View style={[styles.badge, { backgroundColor: near ? colors.brandTint : colors.surface }]}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: near ? colors.brandSoft : colors.textFaint }} />
          <T size={12} color={near ? colors.brandSoft : colors.textMuted}>
            {granted === false ? 'الموقع مقفول' : near ? `إنت عند المحطة · ${meters} م` : 'إنت مش قريب من المحطة'}
          </T>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <T size={13} color={colors.textDim} style={{ textAlign: 'right' }}>
          {s.name}
        </T>
        <T w="bold" size={32} style={{ lineHeight: 42, textAlign: 'right' }}>
          {'إيه الوضع\nعندك دلوقتي؟'}
        </T>
      </View>

      <View style={{ gap: 10 }} accessibilityRole="radiogroup">
        {OPTIONS.map((o) => {
          const on = pick === o.kind;
          const c = statusColors[o.status];
          return (
            <Pressable
              key={o.kind}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => setPick(o.kind)}
              style={[styles.option, { borderColor: on ? c.fill : 'transparent', backgroundColor: on ? c.tint : colors.surface }]}
            >
              <View style={[styles.optionIcon, { backgroundColor: c.fill }]}>
                <StatusGlyph status={o.status} size={24} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <T w="bold" size={19} style={{ textAlign: 'right' }}>
                  {o.title}
                </T>
                <T size={13} color={colors.textMuted} style={{ textAlign: 'right' }}>
                  {o.sub}
                </T>
              </View>
            </Pressable>
          );
        })}
      </View>

      {plugs.length > 0 && pick !== 'queue' && (
        <View style={{ gap: 10 }}>
          <T size={13} color={colors.textDim} style={{ textAlign: 'right' }}>
            على أنهي شاحن؟
          </T>
          <View style={styles.segment}>
            {plugs.map((p) => {
              const on = chosenPlug === p.id;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setPlug(p.id)}
                  style={[styles.segItem, { backgroundColor: on ? colors.text : 'transparent' }]}
                >
                  <T latin w={on ? 'bold' : 'regular'} size={14} color={on ? colors.bg : colors.textMuted}>
                    {`${p.id} ${p.connector.toUpperCase()}`}
                  </T>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <View style={{ marginTop: 'auto', flexDirection: 'row', gap: 8 }}>
        <Pressable accessibilityRole="button" onPress={send} style={styles.send}>
          <T w="bold" size={17} color={colors.brandInk}>
            ابعت · بيوصل للكل فورًا
          </T>
        </Pressable>
        {/* رفع الصور هييجي مع الباك إند */}
        <IconButton label="ضيف صورة (قريبًا)" size={56} style={{ borderRadius: 18, opacity: 0.5 }}>
          <Camera />
        </IconButton>
      </View>
    </View>
  );
}

function Sent({ kind, plugName, onAgain }: { kind: ReportKind; plugName?: { id: string; connector: string }; onAgain: () => void }) {
  const status: StationStatus = kind === 'ok' ? 'working' : kind === 'broken' ? 'broken' : 'queue';
  const c = statusColors[status];
  const pop = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(ring, { toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(float, { toValue: 1, duration: 1600, delay: 300, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [pop, ring, float]);

  const name = plugName ? `${plugName.id} ${plugName.connector}` : '';
  const text =
    kind === 'ok'
      ? `الشاحن ${name} بقى متعلّم «شغّال» على الخريطة دلوقتي، وأي حد جاي في الطريق هيعرف.`
      : kind === 'broken'
        ? `علّمنا ${name || 'المحطة'} إنه ممكن يكون بايظ. لو سواق تاني أكد، هيتعلّم «بايظ» للكل.`
        : 'الناس اللي جاية في الطريق هتعرف إن في طابور، وهتختار محطة تانية.';

  return (
    <View style={[styles.root, { alignItems: 'center', justifyContent: 'center', gap: 18 }]}>
      <View style={{ width: 120, height: 120 }}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: 60, backgroundColor: c.fill, opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }), transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.4] }) }] },
          ]}
        />
        <Animated.View style={[StyleSheet.absoluteFill, styles.badgeBig, { backgroundColor: c.fill, transform: [{ scale: pop }] }]}>
          <StatusGlyph status={status} size={56} />
        </Animated.View>
        <Animated.View
          style={{ position: 'absolute', top: -8, left: -18, opacity: float.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }), transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) }] }}
        >
          <T latin w="bold" size={22} color={colors.brand}>
            +10
          </T>
        </Animated.View>
      </View>
      <T w="bold" size={28}>
        شكرًا! بلاغك وصل
      </T>
      <T size={15} color={colors.textMuted} style={{ textAlign: 'center', lineHeight: 26 }}>
        {text}
      </T>
      <View style={{ alignSelf: 'stretch', gap: 8, marginTop: 18 }}>
        <Pressable accessibilityRole="button" onPress={() => router.dismissTo('/')} style={[styles.sendFull, { backgroundColor: colors.text }]}>
          <T w="bold" size={16} color={colors.bg}>
            رجوع للخريطة
          </T>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onAgain} style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <T size={14} color={colors.textDim}>
            بلّغ تاني
          </T>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, gap: 22 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 16 },
  option: { minHeight: 96, padding: 16, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 2 },
  optionIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  segment: { ...ltrRow, gap: 4, padding: 4, borderRadius: 16, backgroundColor: colors.surface },
  segItem: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sendFull: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  send: { flex: 1, height: 56, borderRadius: 18, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  badgeBig: { borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
});
