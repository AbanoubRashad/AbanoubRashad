import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '../theme';

type P = { size?: number; color?: string };

/** اللوجو المعتمد (B): وصلة سلسلة + برق */
export function Logo({ size = 26, light = colors.text, bolt = colors.brand, stroke = 6 }: { size?: number; light?: string; bolt?: string; stroke?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" strokeLinecap="round" strokeLinejoin="round" accessibilityLabel="وصلة شحن">
      <Path d="M24 18h-6a14 14 0 0 0 0 28h6" stroke={light} strokeWidth={stroke} />
      <Path d="M40 18h6a14 14 0 0 1 0 28h-6" stroke={light} strokeWidth={stroke} />
      <Path d="M35 20L27 33h10l-8 12" stroke={bolt} strokeWidth={stroke} />
    </Svg>
  );
}

export const NavArrow = ({ size = 18, color = colors.brandInk }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M21 3L3 10.5l7.5 3 3 7.5z" />
  </Svg>
);

export const Bell = ({ size = 20, color = colors.text }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
    <Path d="M10 20a2 2 0 0 0 4 0" />
  </Svg>
);

/** سهم رجوع — في RTL بيشاور لليمين */
export const Back = ({ size = 20, color = colors.text }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 6l6 6-6 6" />
  </Svg>
);

export const Close = ({ size = 16, color = colors.text }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round">
    <Path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const Search = ({ size = 18, color = colors.textDim }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round">
    <Circle cx={11} cy={11} r={7} />
    <Path d="M20 20l-4-4" />
  </Svg>
);

export const FilterIcon = ({ size = 14, color = colors.bg }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round">
    <Path d="M4 6h16M7 12h10M10 18h4" />
  </Svg>
);

export const Bookmark = ({ size = 18, color = colors.text, filled }: P & { filled?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={2} strokeLinejoin="round">
    <Path d="M6 3h12v18l-6-4-6 4z" />
  </Svg>
);

export const Camera = ({ size = 22, color = colors.text }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <Circle cx={12} cy={13} r={3.5} />
  </Svg>
);

export const Plus = ({ size = 22, color = colors.brandInk }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round">
    <Path d="M12 5v14M5 12h14" />
  </Svg>
);
