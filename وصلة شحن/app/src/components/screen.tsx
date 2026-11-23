import { router } from 'expo-router';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme';
import { Back, Close } from './icons';
import { IconButton } from './ui';

/** رجوع آمن: لو مفيش تاريخ (فتح اللينك مباشرة) نروح للخريطة */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function BackButton({ close, bg = colors.surface }: { close?: boolean; bg?: string }) {
  return (
    <IconButton label={close ? 'إلغاء' : 'رجوع'} onPress={goBack} bg={bg}>
      {close ? <Close /> : <Back />}
    </IconButton>
  );
}

export function Screen({
  children,
  scroll = true,
  footer,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  footer?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const pad = padded ? { paddingHorizontal: 20 } : null;
  const body = scroll ? (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[{ paddingTop: insets.top + 16, paddingBottom: 24, gap: 22 }, pad, style]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, paddingTop: insets.top + 16, gap: 22 }, pad, style]}>{children}</View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {body}
      {footer ? <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 16 }}>{footer}</View> : null}
    </View>
  );
}
