// @warp-tools/ui — Shared design system
// Components will be added as tools are built

export const colors = {
  background: '#040810',
  card: '#080F1E',
  cardHover: '#0C1528',
  accent: '#00C650',
  accentMuted: '#00C65020',
  text: '#FFFFFF',
  textMuted: '#8B95A5',
  border: '#1A2235',
  danger: '#FF4444',
  warning: '#FFAA00',
} as const;

export type WarpColors = typeof colors;
