import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { PRODUCT_ANALYTICS_CONSENT_VERSION } from '@/shared/services/analytics/events';
import { createPersistedStorage } from '@/shared/stores/create-persisted-storage';
import { DEFAULT_USER_PREFERENCES, type UserPreferences } from '@/shared/types/user';

interface SettingsState {
  preferences: UserPreferences;
  hapticsEnabled: boolean;
  crashReportingEnabled: boolean;
  crashReportingConsentVersion: number;
  crashReportingConsentUpdatedAt: string | null;
  productAnalyticsEnabled: boolean;
  productAnalyticsConsentVersion: number;
  productAnalyticsConsentUpdatedAt: string | null;
  clearLocalDataOnSignOut: boolean;
  sessionTimeoutMinutes: 0 | 15 | 30 | 60 | 120;
  marketingEmailsEnabled: boolean;
  /** Keep Trading DNA behavioural coaching on-device (default true). */
  tradingDnaLocalOnly: boolean;
  hasHydrated: boolean;
  hasCompletedOnboarding: boolean;
  /** Phase X — full AI Mentor Setup + Research Universe completed. */
  mentorSetupCompleted: boolean;
  lastSyncAt: number | null;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setCrashReportingEnabled: (enabled: boolean) => void;
  setProductAnalyticsEnabled: (enabled: boolean) => void;
  setClearLocalDataOnSignOut: (enabled: boolean) => void;
  setSessionTimeoutMinutes: (minutes: 0 | 15 | 30 | 60 | 120) => void;
  setMarketingEmailsEnabled: (enabled: boolean) => void;
  setTradingDnaLocalOnly: (enabled: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setMentorSetupCompleted: (completed: boolean) => void;
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
  productAnalyticsEnabled: false,
  productAnalyticsConsentVersion: PRODUCT_ANALYTICS_CONSENT_VERSION,
  productAnalyticsConsentUpdatedAt: null,
  clearLocalDataOnSignOut: true,
  sessionTimeoutMinutes: 0 as 0 | 15 | 30 | 60 | 120,
  marketingEmailsEnabled: false,
  tradingDnaLocalOnly: true,
  hasHydrated: false,
  hasCompletedOnboarding: false,
  mentorSetupCompleted: false,
  lastSyncAt: null,
};

export function migrateSettingsState(
  persistedState: unknown,
  version: number,
): Partial<SettingsState> {
  const persisted = (persistedState ?? {}) as Partial<SettingsState>;
  let next: Partial<SettingsState> = { ...persisted };
  if (version < 3) {
    next = {
      ...next,
      crashReportingEnabled: false,
      crashReportingConsentVersion: CRASH_REPORTING_CONSENT_VERSION,
      crashReportingConsentUpdatedAt: null,
    };
  }
  if (version < 4) {
    next = {
      ...next,
      clearLocalDataOnSignOut: true,
      sessionTimeoutMinutes: next.sessionTimeoutMinutes ?? 0,
      marketingEmailsEnabled: next.marketingEmailsEnabled ?? false,
    };
  }
  if (version < 5) {
    next = {
      ...next,
      productAnalyticsEnabled: false,
      productAnalyticsConsentVersion: PRODUCT_ANALYTICS_CONSENT_VERSION,
      productAnalyticsConsentUpdatedAt: null,
    };
  }
  if (version < 6) {
    next = {
      ...next,
      // Legacy completed users keep tabs access; Mentor Setup is soft-invited.
      mentorSetupCompleted: next.mentorSetupCompleted ?? false,
    };
  }
  if (version < 7) {
    next = {
      ...next,
      tradingDnaLocalOnly: next.tradingDnaLocalOnly ?? true,
    };
  }
  return next;
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
      setProductAnalyticsEnabled: (productAnalyticsEnabled) =>
        set({
          productAnalyticsEnabled,
          productAnalyticsConsentVersion: PRODUCT_ANALYTICS_CONSENT_VERSION,
          productAnalyticsConsentUpdatedAt: new Date().toISOString(),
        }),
      setClearLocalDataOnSignOut: (clearLocalDataOnSignOut) => set({ clearLocalDataOnSignOut }),
      setSessionTimeoutMinutes: (sessionTimeoutMinutes) => set({ sessionTimeoutMinutes }),
      setMarketingEmailsEnabled: (marketingEmailsEnabled) => set({ marketingEmailsEnabled }),
      setTradingDnaLocalOnly: (tradingDnaLocalOnly) => set({ tradingDnaLocalOnly }),
      setOnboardingCompleted: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),
      setMentorSetupCompleted: (mentorSetupCompleted) => set({ mentorSetupCompleted }),
      setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
      reset: () => set({ ...initialState, hasHydrated: true }),
    }),
    {
      name: 'tradevision-settings',
      version: 7,
      storage: createPersistedStorage(),
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
