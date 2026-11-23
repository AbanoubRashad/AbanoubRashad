import { router } from 'expo-router';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { BackButton, Screen } from '../components/screen';
import { Button, Eyebrow, StatusDot, T } from '../components/ui';
import { ago, statusLabel } from '../domain/status';
import { useApp } from '../store/app-store';
import { colors, statusColors } from '../theme';

export default function AlertsScreen() {
  const app = useApp();
  const watched = app.stations.filter((s) => app.watching.includes(s.id));

  return (
    <Screen footer={<Button label="رجوع للخريطة" variant="surface" height={52} onPress={() => router.dismissTo('/')} />}>
      <View style={styles.between}>
        <BackButton />
        <T w="bold" size={30}>
          التنبيهات
        </T>
      </View>

      <View style={styles.card}>
        {watched.length === 0 ? (
          <T size={14} color={colors.textMuted} style={{ textAlign: 'right', lineHeight: 24 }}>
            مفيش محطات بتراقبها. اضغط على الجرس في أي محطة، وهنبلّغك أول ما حالتها تتغير.
          </T>
        ) : (
          watched.map((s, i) => {
            const st = app.stateOf(s.id);
            return (
              <View key={s.id} style={[styles.watchRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: 14 }]}>
                <StatusDot status={st.status} />
                <Pressable style={{ flex: 1, gap: 2 }} onPress={() => router.push({ pathname: '/station/[id]', params: { id: s.id } })}>
                  <T w="bold" size={15} style={{ textAlign: 'right' }}>
                    {s.name}
                  </T>
                  <T size={12} color={statusColors[st.status].text} style={{ textAlign: 'right' }}>
                    {st.status === 'broken' || st.status === 'conflict'
                      ? 'نبهني لما حد يأكد إنه رجع يشتغل'
                      : st.status === 'working'
                        ? 'بنراقب أي تغيير في الحالة'
                        : 'بنستنى أول بلاغ'}
                  </T>
                </Pressable>
                <Switch
                  accessibilityLabel={`تنبيهات ${s.name}`}
                  value
                  onValueChange={() => app.toggleWatch(s.id)}
                  trackColor={{ true: colors.brand, false: colors.track }}
                  thumbColor={colors.text}
                />
              </View>
            );
          })
        )}
      </View>

      <View>
        <Eyebrow style={{ alignSelf: 'flex-end', marginBottom: 10 }}>LATEST</Eyebrow>
        {app.feed.length === 0 ? (
          <T size={13} color={colors.textDim} style={{ textAlign: 'right' }}>
            لسه مفيش تحديثات.
          </T>
        ) : (
          app.feed.slice(0, 20).map((f, i, arr) => (
            <View key={f.id} style={{ flexDirection: 'row', gap: 14 }}>
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: statusColors[f.kind].fill }} />
                {i < arr.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: colors.lineSoft }} />}
              </View>
              <View style={{ flex: 1, gap: 2, paddingBottom: 18 }}>
                <T size={14} style={{ textAlign: 'right' }}>
                  {f.text}
                </T>
                <T size={12} color={colors.textDim} style={{ textAlign: 'right' }}>
                  {`${statusLabel(f.kind)} · ${ago(f.at, app.now)}`}
                </T>
              </View>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { padding: 18, borderRadius: 24, backgroundColor: colors.surface, gap: 14 },
  watchRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});
