import { Platform, type ViewStyle } from 'react-native';

// «ليل الطريق» — ألوان وخطوط وَصلة شحن، منقولة من التصميم.
// ألوان الحالة محجوزة: أخضر = شغّال، أحمر = بايظ، أصفر = طابور/متضارب، رمادي = مفيش تأكيد.
// لون البراند Cyan بس.

export const colors = {
  bg: '#0A111F',
  bgDeep: '#0B1220',
  sheet: '#0F1728',
  surface: '#121A2B',
  surfaceGlass: 'rgba(18,26,43,0.92)',
  raised: '#18223A',
  track: '#1E2840',
  line: '#18223A',
  lineSoft: '#1A2438',

  text: '#E8EEF8',
  textSoft: '#C3CEE0',
  textMuted: '#9AA8C0',
  textDim: '#7F8DA8',
  textFaint: '#5B6884',

  brand: '#22D3EE',
  brandSoft: '#67E8F9',
  brandInk: '#06202A',
  brandTint: '#0E2A33',

  map: {
    ground: '#0A111F',
    block: '#0E1729',
    park: '#0D2224',
    street: '#152036',
    road: '#2C3D62',
    roadEdge: '#22314F',
    label: '#4A5A80',
  },
} as const;

import type { StationStatus } from '../domain/types';

export type { StationStatus };

export const statusColors: Record<StationStatus, { fill: string; ink: string; text: string; tint: string }> = {
  working: { fill: '#34D399', ink: '#04261A', text: '#6EE7B7', tint: '#0F2A22' },
  broken: { fill: '#F87171', ink: '#3A0B0B', text: '#FCA5A5', tint: '#2E1416' },
  queue: { fill: '#FBBF24', ink: '#3A2A04', text: '#FCD34D', tint: '#2A2110' },
  conflict: { fill: '#FBBF24', ink: '#3A2A04', text: '#FCD34D', tint: '#2A2110' },
  unknown: { fill: '#5B6884', ink: '#0A111F', text: '#9AA8C0', tint: '#121A2B' },
};

export const fonts = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
  latin: 'SpaceGrotesk_600SemiBold',
  latinBold: 'SpaceGrotesk_700Bold',
} as const;

export const radius = { sm: 12, md: 16, lg: 18, xl: 24, sheet: 28, pill: 999 } as const;


/**
 * صف من الشمال لليمين جوه تطبيق RTL (أرقام، فيش، كود).
 * على الموبايل بنستخدم direction، وعلى الويب (اللي مبيدعمهاش) بنعكس الصف.
 */
export const ltrRow: ViewStyle =
  Platform.OS === 'web' ? { flexDirection: 'row-reverse' } : { flexDirection: 'row', direction: 'ltr' };
