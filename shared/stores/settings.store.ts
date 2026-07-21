import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_USER_PREFERENCES, type UserPreferences } from '@/shared/types/user';

interface SettingsState {
  preferences: UserPreferences;
  hapticsEnabled: boolean;
  crashReportingEnabled: boolean;
  crashReportingConsentVersion: number;
  crashReportingConsentUpdatedAt: string | null;
  hasHydrated: boolean;
  hasCompletedOnboarding: boolean;
  lastSyncAt: number | null;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setCrashReportingEnabled: (enabled: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setLastSyncAt: (timestamp: number) => void;
  reset: () => void;
}

export const CRASH_REPORTING_CONSENT_VERSION = 1;

const initialState = {
  preferences: DEFAULT_USER_PREFERENCES,
  hapticsEnabled: true,
  crashReportingEnabled: false,
  crashReportingConsentVersion: CRASH_REPORTING_CONSENT_VERSION,
  crashReportingConsentUpdatedAt: null,
  hasHydrated: false,
  hasCompletedOnboarding: false,
  lastSyncAt: null,
};

export function migrateSettingsState(
  persistedState: unknown,
  version: number,
): Partial<SettingsState> {
  const persisted = (persistedState ?? {}) as Partial<SettingsState>;
  if (version < 3) {
    return {
      ...persisted,
      crashReportingEnabled: false,
      crashReportingConsentVersion: CRASH_REPORTING_CONSENT_VERSION,
      crashReportingConsentUpdatedAt: null,
    };
  }
  return persisted;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,
      setPreferences: (updates) =>
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        })),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setCrashReportingEnabled: (crashReportingEnabled) =>
        set({
          crashReportingEnabled,
          crashReportingConsentVersion: CRASH_REPORTING_CONSENT_VERSION,
          crashReportingConsentUpdatedAt: new Date().toISOString(),
        }),
      setOnboardingCompleted: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),
      setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
      reset: () => set({ ...initialState, hasHydrated: true }),
    }),
    {
      name: 'tradevision-settings',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        const { hasHydrated: _, ...persisted } = state;
        return persisted;
      },
      migrate: migrateSettingsState,
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<SettingsState>;
        return {
          ...currentState,
          ...persisted,
          preferences: {
            ...DEFAULT_USER_PREFERENCES,
            ...(persisted.preferences ?? {}),
          },
        };
      },
      onRehydrateStorage: () => () => {
        useSettingsStore.setState({ hasHydrated: true });
      },
    },
  ),
);
