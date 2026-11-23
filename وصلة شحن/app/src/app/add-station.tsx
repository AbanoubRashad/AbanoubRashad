import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Plus } from '../components/icons';
import { BackButton, Screen } from '../components/screen';
import { Button, Chip, Eyebrow, T } from '../components/ui';
import type { Connector } from '../domain/types';
import { useMyLocation } from '../lib/use-location';
import { useApp } from '../store/app-store';
import { colors, fonts, statusColors, ltrRow } from '../theme';

const OPS = ['Infinity', 'Sha7en', 'Plug (السويدي)', 'Revolta', 'Taqa Volt', 'IKARUS', 'مش عارف'];
const CONNS: Connector[] = ['CCS2', 'Type 2', 'GB/T', 'CHAdeMO'];
const KWS = [null, 22, 60, 120] as const;

export default function AddStationScreen() {
  const app = useApp();
  const { pos, granted } = useMyLocation();
  const [name, setName] = useState('');
  const [op, setOp] = useState('مش عارف');
  const [conn, setConn] = useState<Connector>('CCS2');
  const [kw, setKw] = useState<number | null>(null);
  const [count, setCount] = useState(1);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = name.trim().length >= 3;

  if (app.remote && !app.user) return <Redirect href={{ pathname: '/login', params: { next: '/add-station' } }} />;

  if (done)
    return (
      <Screen scroll={false} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={40} />
        </View>
        <T w="bold" size={26}>
          شكرًا! وصلتنا
        </T>
        <T size={15} color={colors.textMuted} style={{ textAlign: 'center', lineHeight: 26 }}>
          هنراجع المحطة في خلال 24 ساعة، ولما تتأكد هتظهر على الخريطة للكل وتاخد 25 نقطة.
        </T>
        <Button label="رجوع للخريطة" variant="light" style={{ alignSelf: 'stretch' }} onPress={() => router.dismissTo('/')} />
      </Screen>
    );

  return (
    <Screen
      footer={
        <Button
          label="ابعت للمراجعة"
          disabled={!valid}
          style={{ opacity: valid ? 1 : 0.5 }}
          onPress={async () => {
            setError(null);
            const r = await app.addStation({ name: name.trim(), operator: op, connector: conn, kw, count, lat: pos.lat, lng: pos.lng });
            if (r.ok) setDone(true);
            else setError(r.error);
          }}
        />
      }
    >
      <View style={styles.between}>
        <BackButton />
        <Eyebrow>NEW STATION · REVIEWED IN 24H</Eyebrow>
      </View>
      <T w="bold" size={26} style={{ textAlign: 'right' }}>
        محطة مش على الخريطة؟
      </T>
      {error && (
        <T size={13} color={statusColors.broken.text} style={{ textAlign: 'right' }}>
          {error}
        </T>
      )}

      <View style={styles.locBox}>
        <T size={13} color={granted ? colors.textSoft : statusColors.queue.text} style={{ textAlign: 'right' }}>
          {granted
            ? 'هنسجّل المحطة في مكانك الحالي، فاتأكد إنك واقف عندها.'
            : 'الموقع مقفول، افتحه علشان نسجّل مكان المحطة صح.'}
        </T>
        <T latin size={11} color={colors.textDim}>
          {`${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`}
        </T>
      </View>

      <View style={{ gap: 6 }}>
        <T size={13} color={colors.textMuted} style={{ textAlign: 'right' }}>
          اسمها إيه؟
        </T>
        <TextInput
          accessibilityLabel="اسم المحطة"
          placeholder="مثلًا: وطنية – المحور"
          placeholderTextColor={colors.textFaint}
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
      </View>

      <View style={{ gap: 8 }}>
        <T size={13} color={colors.textMuted} style={{ textAlign: 'right' }}>
          مين المشغل؟
        </T>
        <View style={styles.wrap}>
          {OPS.map((o) => (
            <Chip key={o} label={o} active={op === o} onPress={() => setOp(o)} />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <T size={13} color={colors.textMuted} style={{ textAlign: 'right' }}>
          نوع الفيشة والقدرة
        </T>
        <View style={[styles.wrap, ltrRow]}>
          {CONNS.map((c) => (
            <Chip key={c} latin label={c} active={conn === c} onPress={() => setConn(c)} />
          ))}
        </View>
        <View style={[styles.wrap, ltrRow]}>
          {KWS.map((k) => (
            <Chip key={String(k)} latin label={k === null ? '? kW' : `${k} kW`} active={kw === k} onPress={() => setKw(k)} />
          ))}
        </View>
      </View>

      <View style={styles.counter}>
        <T size={15}>عدد الشواحن</T>
        <View style={{ ...ltrRow, alignItems: 'center', gap: 12 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="أقل" onPress={() => setCount((c) => Math.max(1, c - 1))} style={styles.round}>
            <T size={18}>−</T>
          </Pressable>
          <T latin w="bold" size={18}>
            {String(count)}
          </T>
          <Pressable accessibilityRole="button" accessibilityLabel="أكتر" onPress={() => setCount((c) => Math.min(20, c + 1))} style={styles.round}>
            <T size={18}>+</T>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locBox: { padding: 14, borderRadius: 16, backgroundColor: colors.surface, gap: 4 },
  input: { height: 56, paddingHorizontal: 16, borderRadius: 16, backgroundColor: colors.surface, color: colors.text, fontFamily: fonts.regular, fontSize: 16, textAlign: 'right' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  counter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: colors.surface },
  round: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.track, alignItems: 'center', justifyContent: 'center' },
});
