import { View } from 'react-native';

import { colors, statusColors } from '../theme';
import { StatusGlyph, T } from './ui';
import type { MapPin } from './station-map.types';

/** دبوس على شكل نقطة دمع — المختار أكبر وعليه حلقة Cyan */
export function Pin({ pin, selected }: { pin: MapPin; selected: boolean }) {
  const size = selected ? 52 : 38;
  const c = statusColors[pin.status];
  const showNumber = pin.status === 'working' && pin.free !== null;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderBottomLeftRadius: selected ? 4 : 3,
        transform: [{ rotate: '-45deg' }],
        backgroundColor: c.fill,
        borderWidth: selected ? 4 : 3,
        borderColor: selected ? colors.brand : colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }}
    >
      <View style={{ transform: [{ rotate: '45deg' }] }}>
        {showNumber ? (
          <T latin w="bold" size={selected ? 18 : 15} color={c.ink}>
            {String(pin.free)}
          </T>
        ) : (
          <StatusGlyph status={pin.status} size={selected ? 18 : 14} />
        )}
      </View>
    </View>
  );
}
