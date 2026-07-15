import { vars } from 'nativewind';

import { colors } from './theme';

/** CSS variable maps consumed by Tailwind semantic tokens. */
export const darkThemeVars = vars({
  '--color-background': colors.background.primary,
  '--color-background-secondary': colors.background.secondary,
  '--color-background-tertiary': colors.background.tertiary,
  '--color-background-elevated': colors.background.elevated,
  '--color-surface': colors.surface.default,
  '--color-surface-hover': colors.surface.hover,
  '--color-surface-active': colors.surface.active,
  '--color-surface-glass': colors.surface.glass,
  '--color-accent': colors.accent.primary,
  '--color-accent-light': colors.accent.light,
  '--color-accent-dark': colors.accent.dark,
  '--color-accent-muted': colors.accent.muted,
  '--color-bullish': colors.bullish.primary,
  '--color-bullish-muted': colors.bullish.muted,
  '--color-bearish': colors.bearish.primary,
  '--color-bearish-muted': colors.bearish.muted,
  '--color-warning': colors.warning.primary,
  '--color-warning-muted': colors.warning.muted,
  '--color-border': colors.border.default,
  '--color-border-strong': colors.border.strong,
  '--color-border-accent': colors.border.accent,
  '--color-text-primary': colors.text.primary,
  '--color-text-secondary': colors.text.secondary,
  '--color-text-tertiary': colors.text.tertiary,
  '--color-text-inverse': colors.text.inverse,
});

export const lightThemeVars = vars({
  '--color-background': colors.light.background.primary,
  '--color-background-secondary': colors.light.background.secondary,
  '--color-background-tertiary': colors.light.background.tertiary,
  '--color-background-elevated': colors.light.background.elevated,
  '--color-surface': colors.light.surface.default,
  '--color-surface-hover': colors.light.surface.hover,
  '--color-surface-active': colors.light.surface.active,
  '--color-surface-glass': colors.light.surface.glass,
  '--color-accent': colors.light.accent.primary,
  '--color-accent-light': colors.light.accent.light,
  '--color-accent-dark': colors.light.accent.dark,
  '--color-accent-muted': colors.light.accent.muted,
  '--color-bullish': colors.light.bullish.primary,
  '--color-bullish-muted': colors.light.bullish.muted,
  '--color-bearish': colors.light.bearish.primary,
  '--color-bearish-muted': colors.light.bearish.muted,
  '--color-warning': colors.light.warning.primary,
  '--color-warning-muted': colors.light.warning.muted,
  '--color-border': colors.light.border.default,
  '--color-border-strong': colors.light.border.strong,
  '--color-border-accent': colors.light.border.accent,
  '--color-text-primary': colors.light.text.primary,
  '--color-text-secondary': colors.light.text.secondary,
  '--color-text-tertiary': colors.light.text.tertiary,
  '--color-text-inverse': colors.light.text.inverse,
});

export const themeVars = {
  light: lightThemeVars,
  dark: darkThemeVars,
} as const;
