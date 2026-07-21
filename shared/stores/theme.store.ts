import { Appearance } from 'react-native';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  setResolvedTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

function systemResolved(): 'light' | 'dark' {
  return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      resolvedTheme: systemResolved(),
      setMode: (mode) => set({ mode }),
      setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
      toggleTheme: () => {
        const current = get().resolvedTheme;
        const next = current === 'dark' ? 'light' : 'dark';
        set({ mode: next, resolvedTheme: next });
      },
    }),
    {
      name: 'tradevision-theme-v2',
      storage: createPersistedStorage(),
      partialize: (state) => ({ mode: state.mode }),
    },
  ),
);
