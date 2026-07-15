export const colors = {
  background: {
    primary: '#0A0E17',
    secondary: '#111827',
    tertiary: '#1A2235',
    elevated: '#1E293B',
  },
  surface: {
    default: 'rgba(255, 255, 255, 0.04)',
    hover: 'rgba(255, 255, 255, 0.07)',
    active: 'rgba(255, 255, 255, 0.1)',
    glass: 'rgba(17, 24, 39, 0.78)',
  },
  accent: {
    primary: '#2DD4BF',
    light: '#5EEAD4',
    dark: '#14B8A6',
    muted: 'rgba(45, 212, 191, 0.12)',
  },
  bullish: {
    primary: '#34D399',
    muted: 'rgba(52, 211, 153, 0.12)',
  },
  bearish: {
    primary: '#F87171',
    muted: 'rgba(248, 113, 113, 0.12)',
  },
  warning: {
    primary: '#FBBF24',
    muted: 'rgba(251, 191, 36, 0.12)',
  },
  border: {
    default: 'rgba(148, 163, 184, 0.14)',
    strong: 'rgba(148, 163, 184, 0.22)',
    accent: 'rgba(45, 212, 191, 0.16)',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    tertiary: '#64748B',
    inverse: '#0F172A',
  },
  light: {
    background: {
      primary: '#F4F6F9',
      secondary: '#EEF2F7',
      tertiary: '#E2E8F0',
      elevated: '#FFFFFF',
    },
    surface: {
      default: 'rgba(15, 23, 42, 0.03)',
      hover: 'rgba(15, 23, 42, 0.05)',
      active: 'rgba(15, 23, 42, 0.08)',
      glass: 'rgba(255, 255, 255, 0.92)',
    },
    accent: {
      primary: '#0F766E',
      light: '#0D9488',
      dark: '#115E59',
      muted: 'rgba(15, 118, 110, 0.1)',
    },
    bullish: {
      primary: '#059669',
      muted: 'rgba(5, 150, 105, 0.1)',
    },
    bearish: {
      primary: '#DC2626',
      muted: 'rgba(220, 38, 38, 0.1)',
    },
    warning: {
      primary: '#D97706',
      muted: 'rgba(217, 119, 6, 0.1)',
    },
    border: {
      default: 'rgba(15, 23, 42, 0.08)',
      strong: 'rgba(15, 23, 42, 0.14)',
      accent: 'rgba(15, 118, 110, 0.14)',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      tertiary: '#64748B',
      inverse: '#F8FAFC',
    },
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const typography = {
  fontFamily: {
    sans: 'System',
    mono: 'SpaceMono',
  },
  fontSize: {
    '2xs': 10,
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const shadows = {
  glass: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  glassLight: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  glow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,
} as const;

export type ThemeColors = typeof colors;
export type ThemeSpacing = typeof spacing;
export type ThemeTypography = typeof typography;
export type ThemeShadows = typeof shadows;
