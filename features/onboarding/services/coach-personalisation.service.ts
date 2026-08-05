import type { TraderMemory } from '@/features/decision/types/decision.types';

import type { CoachProfile, ResearchTimeOfDay } from '../types/mentor-setup.types';
import {
  RESEARCH_TIME_OF_DAY_LABELS,
  TRADING_STRUGGLE_LABELS,
  TRADING_STYLE_INTEREST_LABELS,
} from '../types/mentor-setup.types';

/** Rotate which mentor mention to use so copy stays natural. */
export function pickMentorPersonalisationLine(
  profile: Pick<CoachProfile, 'struggles' | 'styles' | 'timeBudgetMinutes' | 'coachTone'> | null,
  memory: TraderMemory | null | undefined,
  now = Date.now(),
): string | null {
  const struggles = profile?.struggles?.length
    ? profile.struggles
    : (memory?.struggles as CoachProfile['struggles'] | undefined) ?? [];
  const styles = profile?.styles?.length
    ? profile.styles
    : [];
  const budget = profile?.timeBudgetMinutes;
  const slot = Math.floor(now / (1000 * 60 * 60 * 6)) % 4;

  const lines: string[] = [];
  if (struggles[0]) {
    const label =
      TRADING_STRUGGLE_LABELS[struggles[0] as keyof typeof TRADING_STRUGGLE_LABELS] ??
      struggles[0];
    lines.push(`I remember you said ${label.toLowerCase()} is one of your biggest challenges.`);
  }
  if (styles[0]) {
    const label =
      TRADING_STYLE_INTEREST_LABELS[styles[0] as keyof typeof TRADING_STYLE_INTEREST_LABELS] ??
      styles[0];
    lines.push(`You mentioned you're focused on ${label.toLowerCase()}.`);
  }
  if (budget != null) {
    const mins = budget >= 60 ? '60+' : String(budget);
    lines.push(
      `You have about ${mins} minutes today, so I've prioritised a short research plan.`,
    );
  }
  if (profile?.coachTone === 'gentle' || memory?.coachTone === 'gentle') {
    lines.push('You wanted calmer trading habits — we will keep the pace steady.');
  }

  if (!lines.length) return null;
  return lines[slot % lines.length] ?? lines[0];
}

export function greetingForResearchTime(
  timeOfDay: ResearchTimeOfDay | string | null | undefined,
  fallback = 'Good session',
): string {
  switch (timeOfDay) {
    case 'morning':
      return 'Good morning';
    case 'lunch':
      return 'Good afternoon';
    case 'evening':
      return 'Good evening';
    case 'late_night':
      return 'Late-night focus';
    case 'weekend':
      return 'Weekend research';
    default:
      return fallback;
  }
}

export function researchTimeLabel(
  timeOfDay: ResearchTimeOfDay | string | null | undefined,
): string | null {
  if (!timeOfDay) return null;
  return (
    RESEARCH_TIME_OF_DAY_LABELS[timeOfDay as ResearchTimeOfDay] ?? String(timeOfDay)
  );
}

/** Soft market weight for ranking — higher if market interest matches symbol class. */
export function marketAffinityScore(
  symbol: string,
  markets: string[] | undefined | null,
): number {
  if (!markets?.length) return 0;
  const upper = symbol.toUpperCase();
  let score = 0;
  if (markets.includes('forex') && upper.includes('/')) score += 3;
  if (markets.includes('crypto') && /(BTC|ETH|SOL|USD)/.test(upper) && upper.includes('/')) {
    score += 3;
  }
  if (markets.includes('commodities') && /(XAU|XAG|WTI|GOLD)/.test(upper)) score += 3;
  if (
    (markets.includes('stocks') || markets.includes('etfs') || markets.includes('indices')) &&
    !upper.includes('/')
  ) {
    score += 2;
  }
  return score;
}
