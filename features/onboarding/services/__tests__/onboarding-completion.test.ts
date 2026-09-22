import { useSettingsStore } from '@/shared/stores/settings.store';
import { DEFAULT_USER_PREFERENCES } from '@/shared/types/user';

import {
    completeOnboarding,
    type OnboardingCompletionDependencies,
} from '../onboarding-completion.service';
import {
    reconcileOnboarding,
    type OnboardingReconciliationDependencies,
} from '../onboarding-reconciliation.service';

jest.mock('@/features/profile/services/profile.service', () => ({
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
}));
jest.mock('@/features/settings/services/settings.service', () => ({
  settingsService: {
    hasRemoteSettings: jest.fn(),
    syncToFirestore: jest.fn(),
  },
}));
jest.mock('@/features/decision-log/services/decision-log.service', () => ({
  getDecisionRecords: jest.fn(),
}));
jest.mock('@/firebase/config', () => ({
  DEMO_USER_UID: 'demo-guest',
}));

const input = {
  timeBudgetMinutes: 30 as const,
  activationGoal: 'build_decision_discipline' as const,
  selectedUniverse: ['spy', 'qqq', 'nvda'],
};

describe('onboarding completion and reconciliation', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset();
  });

  it('synchronizes local settings, settings backend, and profile before clearing the draft', async () => {
    const calls: string[] = [];
    const dependencies: OnboardingCompletionDependencies = {
      applyLocal: (value) => {
        calls.push('local');
        useSettingsStore.getState().setPreferences(value);
        useSettingsStore.getState().setOnboardingCompleted(true);
      },
      syncSettings: async () => {
        calls.push('settings');
      },
      syncProfile: async (_uid, value) => {
        calls.push(`profile:${value.selectedUniverse.join(',')}`);
      },
      clearDraft: async () => {
        calls.push('draft');
      },
      now: () => 123,
    };

    await expect(completeOnboarding('user-1', input, dependencies)).resolves.toMatchObject({
      completedAt: 123,
      preferences: {
        timeBudgetMinutes: 30,
        activationGoal: 'build_decision_discipline',
        selectedUniverse: ['SPY', 'QQQ', 'NVDA'],
      },
    });
    expect(calls).toEqual(['local', 'settings', 'profile:SPY,QQQ,NVDA', 'draft']);
    expect(useSettingsStore.getState().hasCompletedOnboarding).toBe(true);
  });

  it('keeps onboarding local when cloud sync is unavailable', async () => {
    await expect(
      completeOnboarding('user-1', input, {
        applyLocal: (value) => {
          useSettingsStore.getState().setPreferences(value);
          useSettingsStore.getState().setOnboardingCompleted(true);
        },
        syncSettings: async () => {
          throw new Error('App Check rejected the request');
        },
        syncProfile: async () => {
          throw new Error('Firestore unavailable');
        },
        clearDraft: async () => undefined,
        now: Date.now,
      }),
    ).resolves.toMatchObject({
      preferences: {
        timeBudgetMinutes: 30,
        activationGoal: 'build_decision_discipline',
        selectedUniverse: ['SPY', 'QQQ', 'NVDA'],
      },
    });
    expect(useSettingsStore.getState().hasCompletedOnboarding).toBe(true);
  });

  it('keeps the app usable when remote sync is interrupted', async () => {
    const clearDraft = jest.fn(async () => undefined);
    await expect(
      completeOnboarding('user-1', input, {
        applyLocal: (value) => {
          useSettingsStore.getState().setPreferences(value);
          useSettingsStore.getState().setOnboardingCompleted(true);
        },
        syncSettings: async () => {
          throw new Error('offline');
        },
        syncProfile: async () => {
          throw new Error('offline');
        },
        clearDraft,
        now: Date.now,
      }),
    ).resolves.toMatchObject({
      preferences: {
        activationGoal: 'build_decision_discipline',
        selectedUniverse: ['SPY', 'QQQ', 'NVDA'],
      },
    });
    expect(clearDraft).toHaveBeenCalledWith('user-1');
    expect(useSettingsStore.getState().hasCompletedOnboarding).toBe(true);
  });

  it('repairs duplicate completion flags for migrated active users', async () => {
    const persistCompletion = jest.fn(async () => undefined);
    const dependencies: OnboardingReconciliationDependencies = {
      loadProfile: async () => ({
        onboardingCompleted: false,
        preferences: DEFAULT_USER_PREFERENCES,
      }),
      countDecisionActivity: async () => 1,
      hasRemoteSettings: async () => false,
      isTodayCoachDismissed: async () => false,
      readLocalState: () => ({ completed: false, lastSyncAt: null }),
      applyLocalPreferences: jest.fn(),
      persistCompletion,
    };

    await expect(reconcileOnboarding('existing-user', dependencies)).resolves.toMatchObject({
      completed: true,
      reason: 'decision_activity',
    });
    expect(persistCompletion).toHaveBeenCalledWith('existing-user', DEFAULT_USER_PREFERENCES);
  });
});
