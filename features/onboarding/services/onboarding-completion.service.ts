import {
  getUserProfile,
  upsertUserProfile,
  updateUserProfile,
} from '@/features/profile/services/profile.service';
import { settingsService } from '@/features/settings/services/settings.service';
import { auth } from '@/firebase/config';
import { useSettingsStore } from '@/shared/stores/settings.store';

import type {
  OnboardingCompletionInput,
  OnboardingCompletionResult,
} from '../types/onboarding.types';

import { clearOnboardingDraft } from './onboarding-draft.service';

export interface OnboardingCompletionDependencies {
  applyLocal: (input: OnboardingCompletionInput) => void;
  syncSettings: (uid: string) => Promise<void>;
  syncProfile: (uid: string, input: OnboardingCompletionInput) => Promise<void>;
  clearDraft: (uid: string) => Promise<void>;
  now: () => number;
}

function normalizeCompletionInput(input: OnboardingCompletionInput): OnboardingCompletionInput {
  if (![10, 20, 30, 45].includes(input.timeBudgetMinutes)) {
    throw new Error('Time budget must be 10, 20, 30, or 45 minutes.');
  }
  if (
    !['research_more_selectively', 'build_decision_discipline', 'improve_review_habit'].includes(
      input.activationGoal,
    )
  ) {
    throw new Error('Invalid activation goal.');
  }
  const selectedUniverse = [
    ...new Set(input.selectedUniverse.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean)),
  ];
  if (selectedUniverse.length < 3 || selectedUniverse.length > 5) {
    throw new Error('Select between 3 and 5 symbols.');
  }
  return { ...input, selectedUniverse };
}

const defaultDependencies: OnboardingCompletionDependencies = {
  applyLocal: (input) => {
    const store = useSettingsStore.getState();
    store.setPreferences(input);
    store.setOnboardingCompleted(true);
  },
  syncSettings: (uid) => settingsService.syncToFirestore(uid),
  syncProfile: async (uid, input) => {
    const existing = await getUserProfile(uid);
    if (!existing) {
      const currentUser = auth?.currentUser;
      await upsertUserProfile({
        uid,
        email: currentUser?.email ?? null,
        displayName: currentUser?.displayName,
        photoURL: currentUser?.photoURL,
      });
    }
    await updateUserProfile(uid, {
      preferences: {
        ...useSettingsStore.getState().preferences,
        ...input,
      },
      onboardingCompleted: true,
    });
  },
  clearDraft: clearOnboardingDraft,
  now: Date.now,
};

/**
 * Canonical completion API. Draft deletion happens last so an interrupted backend
 * sync can be retried without losing the user's choices.
 */
export async function completeOnboarding(
  uid: string,
  input: OnboardingCompletionInput,
  dependencies: OnboardingCompletionDependencies = defaultDependencies,
): Promise<OnboardingCompletionResult> {
  if (!uid) throw new Error('A uid is required to complete onboarding.');
  const normalized = normalizeCompletionInput(input);
  dependencies.applyLocal(normalized);
  await dependencies.syncSettings(uid);
  await dependencies.syncProfile(uid, normalized);
  await dependencies.clearDraft(uid);

  return {
    preferences: {
      ...useSettingsStore.getState().preferences,
      ...normalized,
    },
    completedAt: dependencies.now(),
  };
}
