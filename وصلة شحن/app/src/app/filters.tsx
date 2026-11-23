import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { goBack } from '../components/screen';
import { Button, Eyebrow, T } from '../components/ui';
import { defaultFilters, matchesFilters, type StationFilters } from '../domain/status';
import type { Connector } from '../domain/types';
import { useApp } from '../store/app-store';
import { colors, ltrRow } from '../theme';

const CONNECTORS: [Connector, string][] = [
  ['CCS2', 'DC سريع'],
  ['Type 2', 'AC'],
  ['GB/T', 'صيني'],
  ['CHAdeMO', 'DC'],
];
const POWERS: [number, string][] = [
  [0, 'Any'],
  [22, '22+'],
  [50, '50+'],
  [120, '120+'],
];

export default function FiltersSheet() {
  const app = useApp();
  const insets = useSafeAreaInsets();
  const [f, setF] = useState<StationFilters>(app.filters);
  const count = app.stations.filter((s) => matchesFilters(s, app.stateOf(s.id), f)).length;

  const toggleConnector = (c: Connector) =>
    setF((x) => ({ ...x, connectors: x.connectors.includes(c) ? x.connectors.filter((y) => y !== c) : [...x.connectors, c] }));

  return (
    <View style={styles.backdrop}>
      <Pressable accessibilityLabel="قفل" style={{ flex: 1 }} onPress={goBack} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 22 }]}>
        <View style={styles.grabber} />
        <View style={styles.between}>
          <T w="bold" size={26}>
            الفلاتر
          </T>
          <Pressable accessibilityRole="button" onPress={() => setF(defaultFilters)} hitSlop={10}>
            <T size={14} color={colors.brand}>
              مسح الكل
            </T>
          </Pressable>
        </View>

        <View style={{ gap: 10 }}>
          <Eyebrow style={{ alignSelf: 'flex-end' }}>CONNECTOR</Eyebrow>
          <View style={styles.grid}>
            {CONNECTORS.map(([name, sub]) => {
              const on = f.connectors.includes(name);
              return (
                <Pressable
                  key={name}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => toggleConnector(name)}
                  style={[styles.connector, { backgroundColor: on ? colors.text : colors.surface }]}
                >
                  <T latin w="bold" size={16} color={on ? colors.bg : colors.text}>
                    {name}
                  </T>
                  <T size={12} color={on ? colors.surface : colors.textMuted}>
                    {sub}
                  </T>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Eyebrow style={{ alignSelf: 'flex-end' }}>MIN POWER · kW</Eyebrow>
          <View style={styles.segment}>
            {POWERS.map(([v, l]) => {
              const on = f.minKw === v;
              return (
                <Pressable
                  key={v}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setF((x) => ({ ...x, minKw: v }))}
                  style={[styles.segItem, { backgroundColor: on ? colors.brand : 'transparent' }]}
                >
                  <T latin w={on ? 'bold' : 'regular'} size={15} color={on ? colors.brandInk : colors.textMuted}>
                    {l}
                  </T>
                </Pressable>
              );
            })}
          </View>
        </View>

        <ToggleRow label="اللي اتأكد إنه شغّال بس" value={f.workingOnly} onChange={(v) => setF((x) => ({ ...x, workingOnly: v }))} />
        <ToggleRow label="على طريقي بس" value={f.onRouteOnly} onChange={(v) => setF((x) => ({ ...x, onRouteOnly: v }))} />

        <Button
          label={count === 0 ? 'مفيش محطات' : `اعرض ${count} ${count > 10 || count < 3 ? 'محطة' : 'محطات'}`}
          disabled={count === 0}
          onPress={() => {
            app.setFilters(f);
            goBack();
          }}
        />
      </View>
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.between}>
      <T size={15}>{label}</T>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: colors.brand, false: colors.track }} thumbColor={colors.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(5,9,18,0.6)' },
  sheet: { backgroundColor: colors.sheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 8, paddingHorizontal: 20, gap: 22 },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#2A3654', alignSelf: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grid: { ...ltrRow, flexWrap: 'wrap', gap: 8 },
  connector: { width: '48.5%', height: 72, borderRadius: 18, justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: 16, gap: 2 },
  segment: { ...ltrRow, gap: 4, padding: 4, borderRadius: 16, backgroundColor: colors.surface },
  segItem: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
