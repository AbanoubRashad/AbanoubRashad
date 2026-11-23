import { Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, fonts, radius, statusColors, type StationStatus } from '../theme';

type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

export function T({
  w = 'regular',
  size = 15,
  color = colors.text,
  latin,
  style,
  ...rest
}: TextProps & { w?: Weight; size?: number; color?: string; latin?: boolean }) {
  const family = latin ? (w === 'bold' ? fonts.latinBold : fonts.latin) : fonts[w];
  return <Text {...rest} style={[{ fontFamily: family, fontSize: size, color, writingDirection: latin ? 'ltr' : 'rtl' }, style]} />;
}

/** عنوان صغير إنجليزي بحروف متباعدة زي «INFINITY · 2.1 KM» */
export function Eyebrow({ children, color = colors.textDim, style }: { children: React.ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <T latin size={11} color={color} style={[{ letterSpacing: 2 }, style]}>
      {children}
    </T>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  style,
  height = 56,
  ...rest
}: PressableProps & {
  label: string;
  variant?: 'primary' | 'light' | 'ghost' | 'surface';
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  height?: number;
}) {
  const bg = { primary: colors.brand, light: colors.text, ghost: 'transparent', surface: colors.surface }[variant];
  const fg = { primary: colors.brandInk, light: colors.bg, ghost: colors.textDim, surface: colors.text }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.btn, { backgroundColor: bg, height, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}
      {...rest}
    >
      {icon}
      <T w="bold" size={variant === 'ghost' ? 14 : 16} color={fg}>
        {label}
      </T>
    </Pressable>
  );
}

export function IconButton({
  label,
  onPress,
  children,
  size = 44,
  bg = colors.surface,
  style,
}: {
  label: string;
  onPress?: () => void;
  children: React.ReactNode;
  size?: number;
  bg?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function Chip({ label, active, onPress, latin }: { label: string; active?: boolean; onPress?: () => void; latin?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={{ height: 38, paddingHorizontal: 14, borderRadius: 19, justifyContent: 'center', backgroundColor: active ? colors.text : colors.surfaceGlass }}
    >
      <T latin={latin} w={active ? 'semibold' : 'regular'} size={13} color={active ? colors.bg : colors.textSoft}>
        {label}
      </T>
    </Pressable>
  );
}

/** نقطة الحالة الملونة بالهالة */
export function StatusDot({ status, size = 10 }: { status: StationStatus; size?: number }) {
  const c = statusColors[status].fill;
  const halo = size + 8;
  return (
    <View style={{ width: halo, height: halo, borderRadius: halo / 2, backgroundColor: c + '26', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c }} />
    </View>
  );
}

/** أيقونة الحالة — كل حالة ليها شكل مش لون بس */
export function StatusGlyph({ status, size = 16, color }: { status: StationStatus; size?: number; color?: string }) {
  const ink = color ?? statusColors[status].ink;
  if (status === 'working')
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M5 12l5 5L20 7" />
      </Svg>
    );
  if (status === 'broken')
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth={3.4} strokeLinecap="round">
        <Path d="M6 6l12 12M18 6L6 18" />
      </Svg>
    );
  if (status === 'queue')
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round">
        <Circle cx={12} cy={12} r={8} />
        <Path d="M12 8v4l3 2" />
      </Svg>
    );
  if (status === 'conflict')
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth={3.2} strokeLinecap="round">
        <Path d="M12 6v8M12 18.5v.5" />
      </Svg>
    );
  return (
    <T w="bold" size={size - 1} color={ink}>
      ؟
    </T>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
});
