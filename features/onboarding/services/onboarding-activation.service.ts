import { saveTraderMemory } from '@/features/decision/services/trader-intelligence.service';
import {
  createWatchlist,
  getWatchlists,
  updateWatchlist,
} from '@/features/watchlists/services/watchlist.service';
import { useSettingsStore } from '@/shared/stores/settings.store';

import type { OnboardingCompletionInput } from '../types/onboarding.types';

import { completeOnboarding } from './onboarding-completion.service';
import { normalizeActivationInput } from './onboarding-input.service';

const ACTIVATION_WATCHLIST_NAME = 'My research universe';

/**
 * Persists choices without completing onboarding. This is safe to repeat when
 * a user resumes an interrupted activation.
 */
export async function persistActivationPersonalization(
  uid: string,
  input: OnboardingCompletionInput,
): Promise<OnboardingCompletionInput> {
  const normalized = normalizeActivationInput(input);
  useSettingsStore.getState().setPreferences(normalized);

  const watchlists = await getWatchlists(uid);
  const activationList =
    watchlists.find((list) => list.name === ACTIVATION_WATCHLIST_NAME) ?? watchlists[0];
  if (activationList) {
    await updateWatchlist(uid, activationList.id, { symbols: normalized.selectedUniverse });
  } else {
    await createWatchlist(uid, {
      name: ACTIVATION_WATCHLIST_NAME,
      symbols: normalized.selectedUniverse,
    });
  }

  const tradingStyle =
    normalized.activationGoal === 'research_more_selectively'
      ? 'selective'
      : normalized.activationGoal === 'build_decision_discipline'
        ? 'process-driven'
        : 'reflective';
  await saveTraderMemory(
    {
      favoriteAssets: normalized.selectedUniverse,
      tradingStyle,
      notes: [`Activation goal: ${normalized.activationGoal.replaceAll('_', ' ')}`],
    },
    uid,
  );
  return normalized;
}

export async function finishActivation(
  uid: string,
  input: OnboardingCompletionInput,
): Promise<void> {
  const normalized = await persistActivationPersonalization(uid, input);
  await completeOnboarding(uid, normalized);
}

export async function finishDemoGuide(): Promise<void> {
  useSettingsStore.getState().setOnboardingCompleted(true);
}

export { normalizeActivationInput };
