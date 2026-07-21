import AsyncStorage from '@react-native-async-storage/async-storage';

import { getDecisionRecords } from '@/features/decision-log/services/decision-log.service';
import { getUserProfile, updateUserProfile } from '@/features/profile/services/profile.service';
import { settingsService } from '@/features/settings/services/settings.service';
import { DEMO_USER_UID } from '@/firebase/config';
import { useSettingsStore } from '@/shared/stores/settings.store';
import type { UserPreferences } from '@/shared/types/user';

import type { OnboardingEvidence, OnboardingResolution } from '../types/onboarding.types';

import { loadOnboardingDraft } from './onboarding-draft.service';
import { resolveOnboarding } from './onboarding-migration.service';

export const LEGACY_TODAY_COACH_DISMISS_KEY = 'tradevision-today-coach-dismissed';

interface ReconciliationProfile {
  onboardingCompleted: boolean;
  preferences: UserPreferences;
}

export interface OnboardingReconciliationDependencies {
  loadProfile: (uid: string) => Promise<ReconciliationProfile | null>;
  countDecisionActivity: (uid: string) => Promise<number>;
  hasRemoteSettings: (uid: string) => Promise<boolean>;
  isTodayCoachDismissed: () => Promise<boolean>;
  hasActiveDraft?: (uid: string) => Promise<boolean>;
  readLocalState: () => { completed: boolean; lastSyncAt: number | null };
  applyLocalPreferences: (preferences: UserPreferences) => void;
  persistCompletion: (uid: string, preferences: UserPreferences) => Promise<void>;
}

const defaultDependencies: OnboardingReconciliationDependencies = {
  loadProfile: getUserProfile,
  countDecisionActivity: async (uid) => (await getDecisionRecords(uid, 1)).length,
  hasRemoteSettings: (uid) => settingsService.hasRemoteSettings(uid),
  isTodayCoachDismissed: async () =>
    (await AsyncStorage.getItem(LEGACY_TODAY_COACH_DISMISS_KEY)) === '1',
  hasActiveDraft: async (uid) => (await loadOnboardingDraft(uid)).currentStep > 0,
  readLocalState: () => {
    const state = useSettingsStore.getState();
    return { completed: state.hasCompletedOnboarding, lastSyncAt: state.lastSyncAt };
  },
  applyLocalPreferences: (preferences) => useSettingsStore.getState().setPreferences(preferences),
  persistCompletion: async (uid, preferences) => {
    useSettingsStore.getState().setOnboardingCompleted(true);
    await settingsService.syncToFirestore(uid);
    await updateUserProfile(uid, { onboardingCompleted: true, preferences });
  },
};

export async function reconcileOnboarding(
  uid: string,
  dependencies: OnboardingReconciliationDependencies = defaultDependencies,
): Promise<OnboardingResolution> {
  const [
    profile,
    decisionLogCount,
    remoteSettingsExist,
    todayCoachDismissed,
    activationDraftStarted,
  ] = await Promise.all([
    dependencies.loadProfile(uid),
    dependencies.countDecisionActivity(uid),
    dependencies.hasRemoteSettings(uid),
    dependencies.isTodayCoachDismissed(),
    dependencies.hasActiveDraft?.(uid) ?? Promise.resolve(false),
  ]);
  const local = dependencies.readLocalState();
  if (profile) dependencies.applyLocalPreferences(profile.preferences);

  const evidence: OnboardingEvidence = {
    uid,
    isDemo: uid === DEMO_USER_UID,
    activationDraftStarted,
    profileCompleted: profile?.onboardingCompleted ?? false,
    localCompleted: local.completed,
    decisionLogCount,
    lastSettingsSyncAt: local.lastSyncAt,
    remoteSettingsExist,
    todayCoachDismissed,
  };
  const resolution = resolveOnboarding(evidence);

  if (resolution.completed && resolution.shouldPersistCompletion) {
    await dependencies.persistCompletion(
      uid,
      profile?.preferences ?? useSettingsStore.getState().preferences,
    );
  }
  return resolution;
}
