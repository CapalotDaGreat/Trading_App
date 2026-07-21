import {
  ONBOARDING_DRAFT_VERSION,
  type OnboardingDraft,
  type OnboardingEvidence,
  type OnboardingResolution,
} from '../types/onboarding.types';

const ALLOWED_BUDGETS = new Set([10, 20, 30, 45]);

function normalizeUniverse(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const symbols = [
    ...new Set(
      value
        .filter((symbol): symbol is string => typeof symbol === 'string')
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean),
    ),
  ].slice(0, 20);
  return symbols.length ? symbols : undefined;
}

/** Recovers valid fields from interrupted or older persisted onboarding drafts. */
export function migrateOnboardingDraft(
  value: unknown,
  uid: string,
  now = Date.now(),
): OnboardingDraft {
  const candidate =
    value && typeof value === 'object' ? (value as Record<string, unknown>) : Object.create(null);
  const budget = candidate.timeBudgetMinutes;
  const goal = candidate.activationGoal;
  const updatedAt = candidate.updatedAt;
  const currentStep = candidate.currentStep;
  const outcomeSymbol =
    typeof candidate.outcomeSymbol === 'string' ? candidate.outcomeSymbol.trim().toUpperCase() : '';

  return {
    version: ONBOARDING_DRAFT_VERSION,
    uid,
    ...(typeof budget === 'number' && ALLOWED_BUDGETS.has(budget)
      ? { timeBudgetMinutes: budget }
      : {}),
    ...(goal === 'research_more_selectively' ||
    goal === 'build_decision_discipline' ||
    goal === 'improve_review_habit'
      ? { activationGoal: goal }
      : {}),
    ...(normalizeUniverse(candidate.selectedUniverse)
      ? { selectedUniverse: normalizeUniverse(candidate.selectedUniverse) }
      : {}),
    ...(outcomeSymbol ? { outcomeSymbol } : {}),
    ...(candidate.outcomeAction === 'researched' || candidate.outcomeAction === 'skipped'
      ? { outcomeAction: candidate.outcomeAction }
      : {}),
    currentStep:
      typeof currentStep === 'number' && Number.isInteger(currentStep)
        ? Math.max(0, Math.min(2, currentStep))
        : 0,
    updatedAt: typeof updatedAt === 'number' && Number.isFinite(updatedAt) ? updatedAt : now,
  };
}

/** Resolves duplicate legacy flags without forcing active existing users through onboarding. */
export function resolveOnboarding(evidence: OnboardingEvidence): OnboardingResolution {
  if (evidence.profileCompleted || evidence.localCompleted) {
    return {
      completed: true,
      experience: evidence.isDemo ? 'demo_guide' : 'full',
      reason: 'explicit_completion',
      shouldPersistCompletion: evidence.profileCompleted !== evidence.localCompleted,
    };
  }

  // Seeded demo activity is not proof that the person completed the guided activation.
  if (evidence.isDemo) {
    return {
      completed: false,
      experience: 'demo_guide',
      reason: 'demo_guide',
      shouldPersistCompletion: false,
    };
  }

  // Do not mistake activity created inside an in-progress activation for a
  // legacy-user migration signal.
  if (evidence.activationDraftStarted) {
    return {
      completed: false,
      experience: 'full',
      reason: 'new_user',
      shouldPersistCompletion: false,
    };
  }

  const migrationReason =
    evidence.decisionLogCount > 0
      ? 'decision_activity'
      : evidence.lastSettingsSyncAt !== null || evidence.remoteSettingsExist
        ? 'settings_sync'
        : evidence.todayCoachDismissed
          ? 'today_coach_dismissed'
          : null;

  if (migrationReason) {
    return {
      completed: true,
      experience: 'full',
      reason: migrationReason,
      shouldPersistCompletion: true,
    };
  }

  return {
    completed: false,
    experience: 'full',
    reason: 'new_user',
    shouldPersistCompletion: false,
  };
}
