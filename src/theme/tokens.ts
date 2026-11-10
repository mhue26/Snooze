export const palette = {
  night: '#101b32',
  paper: '#f2f0e9',
  action: '#cbd7fa',
  glow: '#d5dfff',
} as const;

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Semantic colours derived from the four brand tokens only. */
export const theme = {
  screen: palette.night,
  card: palette.paper,
  textOnNight: palette.paper,
  textOnNightMuted: withAlpha(palette.paper, 0.72),
  textOnNightFaint: withAlpha(palette.paper, 0.48),
  textOnPaper: palette.night,
  textOnPaperMuted: withAlpha(palette.night, 0.62),
  textOnPaperFaint: withAlpha(palette.night, 0.48),
  borderOnNight: withAlpha(palette.glow, 0.22),
  borderOnPaper: withAlpha(palette.night, 0.14),
  tabBar: palette.night,
  tabActive: palette.glow,
  tabInactive: withAlpha(palette.paper, 0.5),
  buttonFill: palette.action,
  buttonText: palette.night,
  link: palette.action,
  brandMarkFill: palette.glow,
  brandMarkIcon: palette.night,
  overline: withAlpha(palette.paper, 0.78),
  overlineAccent: palette.glow,
  halo: palette.glow,
  moon: palette.night,
  orbit: withAlpha(palette.night, 0.32),
  artAccent: withAlpha(palette.night, 0.42),
  progressOff: withAlpha(palette.night, 0.18),
  progressOn: palette.night,
  dotActive: palette.glow,
  dotInactive: withAlpha(palette.paper, 0.3),
};
