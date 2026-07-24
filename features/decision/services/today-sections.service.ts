import type { SubscriptionTier } from '@/shared/constants/subscription';

export const TODAY_SECTION_ORDER = [
  'header',
  'morningBrief',
  'mentor',
  'startHere',
  'researchQueue',
  'whyNot',
  'decisionLog',
  'regime',
  'closeLoop',
] as const;

export type TodaySection = (typeof TODAY_SECTION_ORDER)[number];

export function selectTodayTimeBudget(state: {
  preferences: { timeBudgetMinutes: number };
}): number {
  return state.preferences.timeBudgetMinutes;
}

interface TodaySectionContext {
  hasBrief: boolean;
  hasMentor: boolean;
  hasStartHere: boolean;
  hasResearchQueue: boolean;
  hasWhyNot: boolean;
  hasDecisionLog: boolean;
  hasRegime: boolean;
  tier: SubscriptionTier;
}

/**
 * Keeps Today's decision loop stable and testable. Premium adds depth on Review;
 * it never hides the core daily workflow.
 */
export function visibleTodaySections(context: TodaySectionContext): TodaySection[] {
  const visible: Record<TodaySection, boolean> = {
    header: true,
    morningBrief: true,
    mentor: context.hasMentor,
    startHere: context.hasBrief && context.hasStartHere,
    researchQueue: context.hasBrief && context.hasResearchQueue,
    whyNot: context.hasBrief && context.hasWhyNot,
    decisionLog: context.hasDecisionLog,
    regime: context.hasRegime,
    closeLoop: true,
  };

  return TODAY_SECTION_ORDER.filter((section) => visible[section]);
}

export function reviewAccessLabel(tier: SubscriptionTier): string {
  return tier === 'premium'
    ? 'Review your decision process'
    : 'Review your decision process options';
}
