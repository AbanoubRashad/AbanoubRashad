import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Back } from '../components/icons';
import { BackButton, Screen } from '../components/screen';
import { Eyebrow, T } from '../components/ui';
import { useApp } from '../store/app-store';
import { colors, statusColors } from '../theme';

const LEVEL_STEP = 100;

export default function ProfileScreen() {
  const app = useApp();
  const mine = app.myReports;
  const level = Math.floor(app.points / LEVEL_STEP) + 1;
  const toNext = LEVEL_STEP - (app.points % LEVEL_STEP);
  const progress = (app.points % LEVEL_STEP) / LEVEL_STEP;

  // «دقة البلاغات» = نسبة بلاغاتك اللي سواق تاني قال نفس الحاجة بعدها في خلال 3 ساعات
  const confirmed = mine.filter((m) =>
    app.checkIns.some((o) => o.stationId === m.stationId && o.userId !== app.myUserId && o.kind === m.kind && o.at > m.at && o.at - m.at < 3 * 3600_000),
  ).length;
  const accuracy = mine.length ? Math.round((confirmed / mine.length) * 100) : 0;

  return (
    <Screen>
      <View style={styles.between}>
        <BackButton />
        <Eyebrow>PROFILE</Eyebrow>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={styles.avatar}>
          <T w="bold" size={26} color={colors.brandInk}>
            {app.user?.name?.[0] ?? 'أ'}
          </T>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T w="bold" size={22} style={{ textAlign: 'right' }}>
            {app.user?.name ?? app.user?.phone ?? 'زائر'}
          </T>
          <T size={13} color={colors.brandSoft} style={{ textAlign: 'right' }}>
            {`مستكشف الطريق · المستوى ${level}`}
          </T>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(4, progress * 100)}%` }]} />
        </View>
        <T size={12} color={colors.textDim} style={{ textAlign: 'right' }}>
          {`${toNext} نقطة لحد المستوى الجاي`}
        </T>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Stat n={String(mine.length)} label="بلاغ" />
        <Stat n={String(app.pending.length)} label="محطة ضفتها" />
        <Stat n={`${accuracy}%`} label="دقة بلاغاتك" />
      </View>

      <View style={{ gap: 4 }}>
        <Eyebrow style={{ alignSelf: 'flex-end', marginBottom: 6 }}>YOUR REPORTS</Eyebrow>
        {mine.length === 0 && (
          <T size={13} color={colors.textDim} style={{ textAlign: 'right' }}>
            لسه مبلّغتش عن أي محطة. أول ما تشحن، بلّغ وخد 10 نقط.
          </T>
        )}
        {mine.slice(0, 5).map((r) => {
          const s = app.stations.find((x) => x.id === r.stationId);
          const isConfirmed = app.checkIns.some((o) => o.stationId === r.stationId && o.userId !== app.myUserId && o.kind === r.kind && o.at > r.at);
          return (
            <View key={r.id} style={styles.reportRow}>
              <T size={14} style={{ flex: 1, textAlign: 'right' }} numberOfLines={1}>
                {s?.name ?? r.stationId}
              </T>
              <T size={12} color={isConfirmed ? statusColors.working.text : colors.textDim}>
                {isConfirmed ? 'اتأكد · +10' : 'مستني تأكيد'}
              </T>
            </View>
          );
        })}
      </View>

      <View style={styles.menu}>
        <MenuRow label="+ ضيف محطة مش موجودة" onPress={() => router.push('/add-station')} accent />
        <MenuRow label="التنبيهات" detail={`${app.watching.length} شغّالين`} onPress={() => router.push('/alerts')} />
        <MenuRow label="اللغة" detail="العربية" />
        {__DEV__ && <MenuRow label="بيانات تجريبية (للعرض بس)" detail="ضيف" onPress={app.seedDemo} />}
        {app.user ? (
          <MenuRow
            label="تسجيل الخروج"
            danger
            onPress={() => {
              app.signOut();
              router.dismissTo('/');
            }}
          />
        ) : (
          <MenuRow label="سجّل دخول" onPress={() => router.push('/login')} accent />
        )}
      </View>
    </Screen>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <View style={styles.stat}>
      <T latin w="bold" size={24}>
        {n}
      </T>
      <T size={12} color={colors.textDim}>
        {label}
      </T>
    </View>
  );
}

function MenuRow({ label, detail, onPress, accent, danger }: { label: string; detail?: string; onPress?: () => void; accent?: boolean; danger?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={!onPress} style={styles.menuRow}>
      <T w="medium" size={15} color={danger ? statusColors.broken.text : accent ? colors.brand : colors.text}>
        {label}
      </T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {detail && (
          <T size={13} color={colors.textDim}>
            {detail}
          </T>
        )}
        {onPress && !danger && (
          <View style={{ transform: [{ scaleX: -1 }] }}>
            <Back size={16} color={colors.textFaint} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.brand },
  stat: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: colors.surface, gap: 2, alignItems: 'flex-start' },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line },
  menu: { borderRadius: 22, backgroundColor: colors.surface, paddingHorizontal: 16 },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 54, borderBottomWidth: 1, borderBottomColor: colors.line },
});
