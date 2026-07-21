import { DEFAULT_USER_PREFERENCES } from '@/shared/types/user';

import type { OnboardingEvidence } from '../../types/onboarding.types';
import { migrateOnboardingDraft, resolveOnboarding } from '../onboarding-migration.service';

const evidence = (updates: Partial<OnboardingEvidence> = {}): OnboardingEvidence => ({
  uid: 'user-1',
  isDemo: false,
  profileCompleted: false,
  localCompleted: false,
  decisionLogCount: 0,
  lastSettingsSyncAt: null,
  remoteSettingsExist: false,
  todayCoachDismissed: false,
  ...updates,
});

describe('onboarding defaults and migration', () => {
  it('provides canonical personalization defaults', () => {
    expect(DEFAULT_USER_PREFERENCES).toMatchObject({
      timeBudgetMinutes: 20,
      activationGoal: 'research_more_selectively',
      selectedUniverse: ['SPY', 'QQQ', 'AAPL'],
    });
  });

  it('recovers safe fields from a partial legacy draft', () => {
    expect(
      migrateOnboardingDraft(
        {
          uid: 'another-user',
          timeBudgetMinutes: 30,
          selectedUniverse: [' spy ', 'SPY', 'aapl'],
          currentStep: 99,
        },
        'user-1',
        123,
      ),
    ).toEqual({
      version: 1,
      uid: 'user-1',
      timeBudgetMinutes: 30,
      selectedUniverse: ['SPY', 'AAPL'],
      currentStep: 2,
      updatedAt: 123,
    });
  });

  it.each([
    [{ decisionLogCount: 1 }, 'decision_activity'],
    [{ lastSettingsSyncAt: 10 }, 'settings_sync'],
    [{ remoteSettingsExist: true }, 'settings_sync'],
    [{ todayCoachDismissed: true }, 'today_coach_dismissed'],
  ] as const)('bypasses onboarding for existing-user evidence %#', (updates, reason) => {
    expect(resolveOnboarding(evidence(updates))).toMatchObject({
      completed: true,
      reason,
      shouldPersistCompletion: true,
    });
  });

  it('keeps a new user incomplete regardless of verification handled by auth', () => {
    expect(resolveOnboarding(evidence())).toMatchObject({
      completed: false,
      reason: 'new_user',
    });
  });

  it('does not migrate an active draft after its real queue outcome is logged', () => {
    expect(
      resolveOnboarding(evidence({ activationDraftStarted: true, decisionLogCount: 1 })),
    ).toMatchObject({
      completed: false,
      reason: 'new_user',
      shouldPersistCompletion: false,
    });
  });

  it('does not mistake seeded demo activity for completed onboarding', () => {
    expect(
      resolveOnboarding(evidence({ uid: 'demo-guest', isDemo: true, decisionLogCount: 3 })),
    ).toEqual({
      completed: false,
      experience: 'demo_guide',
      reason: 'demo_guide',
      shouldPersistCompletion: false,
    });
  });
});
