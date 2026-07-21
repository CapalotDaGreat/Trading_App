import type { OnboardingCompletionInput } from '../types/onboarding.types';

export function normalizeActivationInput(
  input: OnboardingCompletionInput,
): OnboardingCompletionInput {
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
