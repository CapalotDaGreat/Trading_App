import { colors } from '@/shared/constants/theme';
import { useThemeStore } from '@/shared/stores/theme.store';

export function useTheme() {
  const { mode, resolvedTheme, setMode, toggleTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const themeColors = isDark
    ? {
        background: colors.background,
        surface: colors.surface,
        accent: colors.accent,
        bullish: colors.bullish,
        bearish: colors.bearish,
        warning: colors.warning,
        info: colors.info,
        focus: colors.focus,
        disabled: colors.disabled,
        chart: colors.chart,
        border: colors.border,
        text: colors.text,
      }
    : {
        background: colors.light.background,
        surface: colors.light.surface,
        accent: colors.light.accent,
        bullish: colors.light.bullish,
        bearish: colors.light.bearish,
        warning: colors.light.warning,
        info: colors.light.info,
        focus: colors.light.focus,
        disabled: colors.light.disabled,
        chart: colors.light.chart,
        border: colors.light.border,
        text: colors.light.text,
      };

  return {
    mode,
    resolvedTheme,
    isDark,
    colors: themeColors,
    setMode,
    toggleTheme,
  };
}
