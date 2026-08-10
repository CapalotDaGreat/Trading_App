export const colors = {
  background: {
    /**
     * Soft charcoal dark mode — lifted from near-black so the app feels
     * open and welcoming while staying clearly dark-first.
     */
    primary: '#151922',
    secondary: '#1B202B',
    tertiary: '#232936',
    elevated: '#2A3140',
  },
  surface: {
    default: 'rgba(255, 255, 255, 0.05)',
    hover: 'rgba(255, 255, 255, 0.075)',
    active: 'rgba(255, 255, 255, 0.1)',
    glass: 'rgba(30, 36, 48, 0.92)',
  },
  accent: {
    primary: '#2DD4BF',
    light: '#5EEAD4',
    dark: '#14B8A6',
    muted: 'rgba(45, 212, 191, 0.14)',
  },
  bullish: {
    primary: '#34D399',
    muted: 'rgba(52, 211, 153, 0.14)',
  },
  bearish: {
    primary: '#F87171',
    muted: 'rgba(248, 113, 113, 0.14)',
  },
  warning: {
    primary: '#FBBF24',
    muted: 'rgba(251, 191, 36, 0.14)',
  },
  info: {
    primary: '#60A5FA',
    muted: 'rgba(96, 165, 250, 0.14)',
  },
  focus: {
    ring: '#5EEAD4',
  },
  disabled: {
    background: 'rgba(148, 163, 184, 0.14)',
    foreground: '#A1AEBF',
  },
  chart: {
    grid: 'rgba(148, 163, 184, 0.14)',
    axis: '#A1AEBF',
    primary: '#2DD4BF',
    secondary: '#60A5FA',
    neutral: '#CBD5E1',
  },
  border: {
    default: 'rgba(148, 163, 184, 0.1)',
    strong: 'rgba(148, 163, 184, 0.16)',
    accent: 'rgba(45, 212, 191, 0.22)',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#A8B4C4',
    tertiary: '#8492A6',
    inverse: '#151922',
    onAccent: '#06201D',
    onDanger: '#270707',
  },
  light: {
    background: {
      primary: '#F8F9FB',
      secondary: '#F1F3F7',
      tertiary: '#E8ECF2',
      elevated: '#FFFFFF',
    },
    surface: {
      default: 'rgba(15, 23, 42, 0.028)',
      hover: 'rgba(15, 23, 42, 0.045)',
      active: 'rgba(15, 23, 42, 0.065)',
      glass: 'rgba(255, 255, 255, 0.97)',
    },
    accent: {
      primary: '#0F766E',
      light: '#0D9488',
      dark: '#115E59',
      muted: 'rgba(15, 118, 110, 0.1)',
    },
    bullish: {
      primary: '#059669',
      muted: 'rgba(5, 150, 105, 0.12)',
    },
    bearish: {
      primary: '#DC2626',
      muted: 'rgba(220, 38, 38, 0.12)',
    },
    warning: {
      primary: '#D97706',
      muted: 'rgba(217, 119, 6, 0.12)',
    },
    info: {
      primary: '#2563EB',
      muted: 'rgba(37, 99, 235, 0.12)',
    },
    focus: {
      ring: '#0D9488',
    },
    disabled: {
      background: 'rgba(100, 116, 139, 0.12)',
      foreground: '#64748B',
    },
    chart: {
      grid: 'rgba(71, 85, 105, 0.14)',
      axis: '#475569',
      primary: '#0F766E',
      secondary: '#2563EB',
      neutral: '#64748B',
    },
    border: {
      default: 'rgba(15, 23, 42, 0.04)',
      strong: 'rgba(15, 23, 42, 0.09)',
      accent: 'rgba(15, 118, 110, 0.18)',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      tertiary: '#64748B',
      inverse: '#F8FAFC',
      onAccent: '#FFFFFF',
      onDanger: '#FFFFFF',
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
  /** Phase A calm rhythm — prefer these over ad-hoc gaps. */
  focus: 28,
  section: 36,
  screenX: 24,
  screenY: 20,
} as const;

/** Minimum interactive target (Apple HIG / Material). */
export const touchTarget = {
  min: 44,
  comfortable: 52,
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
  /** Quiet elevation — prefer fill hierarchy over heavy shadow. */
  glass: {
    shadowColor: '#0B0F16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 3,
  },
  glassLight: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  glow: {
    shadowColor: '#0B0F16',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.26,
    shadowRadius: 16,
    elevation: 4,
  },
  card: {
    shadowColor: '#0B0F16',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 2,
  },
  sm: {
    shadowColor: '#0B0F16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 1,
  },
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  control: 12,
  card: 16,
  panel: 20,
  pill: 9999,
  full: 9999,
} as const;

export type ThemeColors = typeof colors;
export type ThemeSpacing = typeof spacing;
export type ThemeTypography = typeof typography;
export type ThemeShadows = typeof shadows;
