import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueryClient } from '@tanstack/react-query';

import { useChecklistStore } from '@/features/academy/stores/checklist.store';
import { useAcademyProgressStore } from '@/features/academy/stores/academy-progress.store';
import { useDecisionPassportStore } from '@/features/decision-passport/stores/passport.store';
import { useDecisionLabStore } from '@/features/decision-lab/stores/lab.store';
import { useReplayTvStore } from '@/features/decision-replay-tv/stores/replay-tv.store';
import { useSimulatorStore } from '@/features/decision-simulator/stores/simulator.store';
import { useEducationalStore } from '@/features/educational/stores/educational.store';
import { useJournalDraftStore } from '@/features/journal/stores/journal-draft.store';
import { useCompetencyEvidenceStore } from '@/features/competency/stores/competency-evidence.store';
import { useLearnerBehaviorStore } from '@/features/learner-model/stores/learner-behavior.store';
import { useLearningQueueStore } from '@/features/learning-engine/stores/learning-queue.store';
import { usePracticeProgressStore } from '@/features/practice/stores/practice-progress.store';
import { useSimulationStore } from '@/features/simulation/stores/simulation.store';
import { notificationService } from '@/features/notifications/services/notification.service';
import { onboardingDraftStorageKey } from '@/features/onboarding/services/onboarding-draft.service';
import { coachProfileStorageKey } from '@/features/onboarding/services/coach-profile.service';
import { mentorSetupDraftStorageKey } from '@/features/onboarding/services/mentor-setup-draft.service';
import { useOnboardingStore } from '@/features/onboarding/stores/onboarding.store';
import { logger } from '@/shared/services/observability/logger';
import {
  secureStorageService,
  SecureStorageKeys,
} from '@/shared/services/storage/secure-storage.service';
import { useSettingsStore } from '@/shared/stores/settings.store';
import { useSubscriptionStore } from '@/shared/stores/subscription.store';

import { getLocalUserRepository } from './local-user.repository';

/**
 * AsyncStorage keys wiped on sign-out and account deletion.
 * Theme (`tradevision-theme-v2`) is intentionally preserved as a device preference.
 */
export const USER_LOCAL_STORAGE_KEYS = [
  'tradevision-settings',
  'tradevision-subscription',
  'tradevision-academy-progress',
  'tradevision-checklist-progress',
  'tradevision-decision-lab-v1',
  'tradevision-decision-ui',
  'tradevision-ai-usage',
  'tradevision-trader-memory',
  'tradevision-conviction-drift-v1',
  'tradevision-discipline-streak-v1',
  'tradevision-day-plan-done-v1',
  'tradevision-research-queue-done-v1',
  'tradevision-decision-replay-demo-seed-v1',
  'tradevision-decision-log',
  'tradevision-today-coach-dismissed',
  'tradevision-educational-mode-v1',
  'tradevision-decision-simulator-v1',
  'tradevision-decision-passport-v1',
  'tradevision-brief-logged-day',
  'tradevision-portfolio-reviewed-day',
  'tradevision-ai-recommendation-history-v1',
  'tradevision-simulation-v1',
  'tradevision-practice-progress-v1',
  'tradevision-journal-draft-v1',
  'tradevision-replay-tv-v2',
  'tradevision-learning-queue-v1',
  'tradevision-competency-evidence-v1',
  'tradevision-learner-behavior-v1',
  'tradevision-learner-sync-queue-v1',
  'tradevision-last-auth-uid',
] as const;

export interface ClearUserLocalStateOptions {
  /**
   * `delete` — full wipe including onboarding (account deletion).
   * `logout` — wipe user data on shared devices but keep device onboarding completion.
   */
  mode?: 'logout' | 'delete';
}

export interface ClearUserLocalStateResult {
  uid: string;
  removedAsyncStorageKeys: readonly string[];
  preservedDeviceKeys: readonly ['tradevision-theme-v2'];
}

export async function clearAllUserLocalState(
  uid: string,
  queryClient?: QueryClient,
  options: ClearUserLocalStateOptions = {},
): Promise<ClearUserLocalStateResult> {
  const mode = options.mode ?? 'delete';
  const preserveOnboarding = mode === 'logout';
  const hadCompletedOnboarding = useSettingsStore.getState().hasCompletedOnboarding;

  const token = await notificationService.getExpoPushToken();
  if (token) {
    await notificationService
      .removeTokenFromFirestore(uid, token)
      .catch((error) => logger.warn('account.push_token_cleanup_failed', { error }));
  }

  await Promise.all([
    getLocalUserRepository(uid).reset(),
    notificationService.cancelAllScheduled(),
    notificationService.setBadgeCount(0),
    secureStorageService.clear(Object.values(SecureStorageKeys)),
  ]);

  useSettingsStore.getState().reset();
  if (preserveOnboarding && hadCompletedOnboarding) {
    useSettingsStore.getState().setOnboardingCompleted(true);
  }
  useSubscriptionStore.getState().reset();
  useAcademyProgressStore.getState().resetProgress();
  useChecklistStore.setState({ checkedItems: {} });
  useDecisionLabStore.getState().resetAccount();
  useOnboardingStore.getState().resetMemory();
  useSimulatorStore.setState({ activeSession: null, history: [] });
  useSimulationStore.setState({ accountsByUser: {}, archivesByUser: {} });
  usePracticeProgressStore.setState({ attempts: [] });
  useLearningQueueStore.getState().reset();
  useCompetencyEvidenceStore.getState().resetAll();
  useLearnerBehaviorStore.getState().resetAll();
  useJournalDraftStore.getState().clearDraft();
  useReplayTvStore.setState({
    progressByUser: {},
    activeSessionByUser: {},
  });
  useDecisionPassportStore.setState({
    credentials: [],
    processScores: [],
    lastAction: undefined,
    unlockedAchievementDates: {},
  });
  useEducationalStore.setState({ labOnboardingDismissed: false });
  queryClient?.clear();

  const keys = [
    ...USER_LOCAL_STORAGE_KEYS,
    onboardingDraftStorageKey(uid),
    coachProfileStorageKey(uid),
    mentorSetupDraftStorageKey(uid),
  ];
  await AsyncStorage.multiRemove(keys);

  return {
    uid,
    removedAsyncStorageKeys: keys,
    preservedDeviceKeys: ['tradevision-theme-v2'],
  };
}
