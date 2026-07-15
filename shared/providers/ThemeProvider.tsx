import { StatusBar } from 'expo-status-bar';
import { colorScheme } from 'nativewind';
import { type ReactNode, useEffect } from 'react';
import { Appearance, View, useColorScheme as useSystemColorScheme } from 'react-native';

import { themeVars } from '@/shared/constants/theme-vars';
import { useThemeStore } from '@/shared/stores/theme.store';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemScheme = useSystemColorScheme();
  const { mode, resolvedTheme, setResolvedTheme } = useThemeStore();

  useEffect(() => {
    if (mode === 'system') {
      colorScheme.set('system');
      const next = systemScheme === 'light' ? 'light' : 'dark';
      setResolvedTheme(next);
    } else {
      colorScheme.set(mode);
      setResolvedTheme(mode);
    }
  }, [mode, systemScheme, setResolvedTheme]);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme: scheme }) => {
      if (useThemeStore.getState().mode !== 'system') return;
      setResolvedTheme(scheme === 'light' ? 'light' : 'dark');
    });
    return () => sub.remove();
  }, [setResolvedTheme]);

  const isDark = resolvedTheme === 'dark';

  return (
    <View style={[{ flex: 1 }, themeVars[resolvedTheme]]} className="flex-1 bg-background">
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </View>
  );
}
