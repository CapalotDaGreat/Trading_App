import { StatusBar } from 'expo-status-bar';
import { colorScheme } from 'nativewind';
import { type ReactNode, useEffect } from 'react';
import { Appearance, View, useColorScheme as useSystemColorScheme } from 'react-native';

import { themeVars } from '@/shared/constants/theme-vars';
import { useThemeStore } from '@/shared/stores/theme.store';

interface ThemeProviderProps {
  children: ReactNode;
}

function resolveTheme(
  mode: 'light' | 'dark' | 'system',
  systemScheme: string | null | undefined,
): 'light' | 'dark' {
  if (mode === 'system') {
    return systemScheme === 'light' ? 'light' : 'dark';
  }
  return mode;
}

/**
 * Keep NativeWind + Zustand theme in sync without synchronous setState in effects
 * (React 19 / Expo web treats that as a hard error).
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemScheme = useSystemColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const setResolvedTheme = useThemeStore((s) => s.setResolvedTheme);

  const displayTheme = resolveTheme(mode, systemScheme);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      try {
        colorScheme.set(mode === 'system' ? 'system' : mode);
      } catch {
        // NativeWind may not expose colorScheme on every web SSR path.
      }
      if (useThemeStore.getState().resolvedTheme !== displayTheme) {
        setResolvedTheme(displayTheme);
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mode, displayTheme, setResolvedTheme]);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme: scheme }) => {
      if (useThemeStore.getState().mode !== 'system') return;
      const next = scheme === 'light' ? 'light' : 'dark';
      setTimeout(() => {
        if (useThemeStore.getState().resolvedTheme !== next) {
          setResolvedTheme(next);
        }
      }, 0);
    });
    return () => sub.remove();
  }, [setResolvedTheme]);

  const isDark = displayTheme === 'dark';

  return (
    <View style={[{ flex: 1 }, themeVars[displayTheme]]} className="flex-1 bg-background">
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </View>
  );
}
