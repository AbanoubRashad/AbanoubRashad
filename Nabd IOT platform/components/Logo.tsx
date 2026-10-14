export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
      <rect x="0.5" y="0.5" width="35" height="35" rx="9" fill="#10161E" stroke="#222D3A" />
      <path
        d="M6 19 H12 L15 11 L19 26 L22 16 L24 19 H30"
        fill="none"
        stroke="#3DDC97"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
