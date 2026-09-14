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

import { RETIRED_PERSIST_TOKEN } from './legacy-persist-migration';
import { getLocalUserRepository } from './local-user.repository';

/**
 * AsyncStorage keys wiped on sign-out and account deletion.
 * Theme (`tradeacademy-theme-v2`) is intentionally preserved as a device preference.
 */
export const USER_LOCAL_STORAGE_KEYS = [
  'tradeacademy-settings',
  'tradeacademy-subscription',
  'tradeacademy-academy-progress',
  'tradeacademy-checklist-progress',
  'tradeacademy-decision-lab-v1',
  'tradeacademy-decision-ui',
  'tradeacademy-ai-usage',
  'tradeacademy-trader-memory',
  'tradeacademy-conviction-drift-v1',
  'tradeacademy-discipline-streak-v1',
  'tradeacademy-day-plan-done-v1',
  'tradeacademy-research-queue-done-v1',
  'tradeacademy-decision-replay-demo-seed-v1',
  'tradeacademy-decision-log',
  'tradeacademy-today-coach-dismissed',
  'tradeacademy-educational-mode-v1',
  'tradeacademy-decision-simulator-v1',
  'tradeacademy-decision-passport-v1',
  'tradeacademy-brief-logged-day',
  'tradeacademy-portfolio-reviewed-day',
  'tradeacademy-ai-recommendation-history-v1',
  'tradeacademy-simulation-v1',
  'tradeacademy-practice-progress-v1',
  'tradeacademy-journal-draft-v1',
  'tradeacademy-replay-tv-v2',
  'tradeacademy-learning-queue-v1',
  'tradeacademy-competency-evidence-v1',
  'tradeacademy-learner-behavior-v1',
  'tradeacademy-learner-sync-queue-v1',
  'tradeacademy-last-auth-uid',
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
  preservedDeviceKeys: readonly ['tradeacademy-theme-v2'];
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
  const leftover = (await AsyncStorage.getAllKeys()).filter((key) =>
    key.includes(RETIRED_PERSIST_TOKEN),
  );
  if (leftover.length > 0) {
    await AsyncStorage.multiRemove(leftover);
  }

  return {
    uid,
    removedAsyncStorageKeys: keys,
    preservedDeviceKeys: ['tradeacademy-theme-v2'],
  };
}
