import { View } from 'react-native';

import { colors, statusColors, type StationStatus } from '../theme';

/** شريط آخر N ساعة: كل خانة بلون الحالة، والفاضية بلون خافت */
export function HistoryBar({ history, height = 6 }: { history: (StationStatus | null)[]; height?: number }) {
  return (
    <View accessible={false} style={{ flexDirection: 'row', gap: 3 }}>
      {history.map((h, i) => (
        <View key={i} style={{ flex: 1, height, borderRadius: height / 2, backgroundColor: h ? statusColors[h].fill : colors.track }} />
      ))}
    </View>
  );
}
