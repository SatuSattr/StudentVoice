/**
 * StudentVoice Design System
 * Dark mode by default - Twitter/Threads-inspired
 */

export const Colors = {
  dark: {
    // Backgrounds
    bg: '#0D0D0D',
    surface: '#161B22',
    surfaceElevated: '#1C2128',
    border: '#30363D',
    borderLight: '#21262D',

    // Text
    text: '#F0F6FC',
    textSecondary: '#8B949E',
    textMuted: '#6E7681',

    // Brand & Actions
    primary: '#4F8EF7',
    primaryDark: '#1F6FEB',

    // Status
    like: '#F85149',
    repost: '#3FB950',
    comment: '#4F8EF7',
    bookmark: '#D29922',

    // Tab bar
    tabBar: '#0D0D0D',
    tabIconDefault: '#6E7681',
    tabIconSelected: '#4F8EF7',
    tint: '#4F8EF7',
    icon: '#8B949E',
    background: '#0D0D0D',
  },
  light: {
    bg: '#FFFFFF',
    surface: '#F6F8FA',
    surfaceElevated: '#FFFFFF',
    border: '#D0D7DE',
    borderLight: '#E1E4E8',

    text: '#1C2128',
    textSecondary: '#57606A',
    textMuted: '#8C959F',

    primary: '#0969DA',
    primaryDark: '#0550AE',

    like: '#CF222E',
    repost: '#1A7F37',
    comment: '#0969DA',
    bookmark: '#9A6700',

    tabBar: '#FFFFFF',
    tabIconDefault: '#8C959F',
    tabIconSelected: '#0969DA',
    tint: '#0969DA',
    icon: '#57606A',
    background: '#FFFFFF',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};
