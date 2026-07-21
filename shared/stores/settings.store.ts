import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_USER_PREFERENCES, type UserPreferences } from '@/shared/types/user';

interface SettingsState {
  preferences: UserPreferences;
  hapticsEnabled: boolean;
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;
  personalizedAds: boolean;
  shareUsageData: boolean;
  hasCompletedOnboarding: boolean;
  lastSyncAt: number | null;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setAnalyticsEnabled: (enabled: boolean) => void;
  setCrashReportingEnabled: (enabled: boolean) => void;
  setPersonalizedAds: (enabled: boolean) => void;
  setShareUsageData: (enabled: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setLastSyncAt: (timestamp: number) => void;
  reset: () => void;
}

const initialState = {
  preferences: DEFAULT_USER_PREFERENCES,
  hapticsEnabled: true,
  analyticsEnabled: true,
  crashReportingEnabled: true,
  personalizedAds: false,
  shareUsageData: false,
  hasCompletedOnboarding: false,
  lastSyncAt: null,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,
      setPreferences: (updates) =>
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        })),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setAnalyticsEnabled: (analyticsEnabled) => set({ analyticsEnabled }),
      setCrashReportingEnabled: (crashReportingEnabled) => set({ crashReportingEnabled }),
      setPersonalizedAds: (personalizedAds) => set({ personalizedAds }),
      setShareUsageData: (shareUsageData) => set({ shareUsageData }),
      setOnboardingCompleted: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),
      setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
      reset: () => set(initialState),
    }),
    {
      name: 'tradevision-settings',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState) => persistedState,
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
    },
  ),
);
