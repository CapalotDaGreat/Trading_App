import type { SubscriptionTier } from '@/shared/constants/subscription';
import type { TodayArchetype } from '@/features/personal-intelligence/types/personal-intelligence.types';

export const TODAY_SECTION_ORDER = [
  'header',
  'dynamicToday',
  'morningBrief',
  'mentor',
  'goals',
  'dayPlan',
  'dnaPulse',
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
  hasGoals?: boolean;
  hasDayPlan?: boolean;
  hasDnaPulse?: boolean;
  hasDynamicToday?: boolean;
  tier: SubscriptionTier;
  /** Optional personalized order from Personal Intelligence. */
  preferredOrder?: readonly TodaySection[];
  archetype?: TodayArchetype;
}

/**
 * Keeps Today's decision loop stable and testable. Premium adds depth on Review;
 * it never hides the core daily workflow. Personal Intelligence may reorder sections.
 */
export function visibleTodaySections(context: TodaySectionContext): TodaySection[] {
  const visible: Record<TodaySection, boolean> = {
    header: true,
    dynamicToday: context.hasDynamicToday !== false,
    morningBrief: true,
    mentor: context.hasMentor,
    goals: Boolean(context.hasGoals),
    dayPlan: Boolean(context.hasDayPlan),
    dnaPulse: Boolean(context.hasDnaPulse),
    startHere: context.hasBrief && context.hasStartHere,
    researchQueue: context.hasBrief && context.hasResearchQueue,
    whyNot: context.hasBrief && context.hasWhyNot,
    decisionLog: context.hasDecisionLog,
    regime: context.hasRegime,
    closeLoop: true,
  };

  const order =
    context.preferredOrder && context.preferredOrder.length > 0
      ? context.preferredOrder
      : TODAY_SECTION_ORDER;

  const seen = new Set<TodaySection>();
  const result: TodaySection[] = [];
  for (const section of order) {
    if (!visible[section] || seen.has(section)) continue;
    seen.add(section);
    result.push(section);
  }
  for (const section of TODAY_SECTION_ORDER) {
    if (visible[section] && !seen.has(section)) result.push(section);
  }
  return result;
}

export function reviewAccessLabel(tier: SubscriptionTier): string {
  return tier === 'premium'
    ? 'Review your decision process'
    : 'Review your decision process options';
}
