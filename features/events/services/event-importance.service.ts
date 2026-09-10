import type { EventImpact } from '@/features/calendar/services/economic-calendar.service';
import type { LearningTopic } from '@/shared/constants/learning-topics';
import type { SkillDomain } from '@/shared/constants/skill-domains';
import type { TradingStruggle } from '@/features/onboarding/types/mentor-setup.types';
import type { MarketEventImportance, MarketEventKind, MarketEventLifecycle } from '../types/events.types';

const KIND_HISTORICAL: Partial<Record<MarketEventKind, number>> = {
  interest_rate: 18,
  inflation: 16,
  employment: 15,
  gdp: 10,
  earnings: 8,
  geopolitical: 9,
  regulatory: 7,
  corporate: 5,
};

const KIND_SCOPE: Partial<Record<MarketEventKind, number>> = {
  interest_rate: 16,
  inflation: 15,
  employment: 14,
  gdp: 12,
  geopolitical: 13,
  regulatory: 10,
  earnings: 7,
  trade: 10,
};

const KIND_VOL: Partial<Record<MarketEventKind, number>> = {
  interest_rate: 16,
  inflation: 15,
  employment: 13,
  geopolitical: 14,
  earnings: 10,
  corporate: 8,
};

const TOPIC_KIND: Partial<Record<LearningTopic, MarketEventKind[]>> = {
  fundamentals: ['interest_rate', 'inflation', 'employment', 'gdp', 'earnings', 'corporate'],
  risk: ['interest_rate', 'geopolitical', 'regulatory', 'inflation'],
  decision_making: ['geopolitical', 'regulatory', 'interest_rate'],
};

const WEAKNESS_KIND: Partial<Record<SkillDomain, MarketEventKind[]>> = {
  fundamental_analysis: ['interest_rate', 'inflation', 'employment', 'gdp', 'earnings'],
  risk_management: ['interest_rate', 'geopolitical', 'inflation'],
  market_understanding: ['interest_rate', 'gdp', 'geopolitical'],
  decision_making: ['geopolitical', 'regulatory'],
  portfolio_management: ['interest_rate', 'inflation', 'gdp'],
};

const STRUGGLE_KIND: Partial<Record<TradingStruggle, MarketEventKind[]>> = {
  risk_management: ['interest_rate', 'inflation', 'geopolitical'],
  emotions: ['geopolitical', 'earnings'],
  fomo: ['earnings', 'corporate'],
  overtrading: ['earnings', 'interest_rate'],
};

export interface ImportanceInput {
  kind: MarketEventKind;
  title: string;
  impact?: EventImpact;
  lifecycle: MarketEventLifecycle;
  countryCode?: string;
  historicalRelevance?: number;
  marketScope?: number;
  volatilityPotential?: number;
  preferredTopics?: LearningTopic[];
  weakness?: SkillDomain | null;
  struggles?: TradingStruggle[];
}

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreEventImportance(input: ImportanceInput): MarketEventImportance {
  const reasons: string[] = [];
  let score = 12;

  if (input.impact === 'high') {
    score += 22;
    reasons.push('Vendor/calendar impact is marked high — still not a popularity rank.');
  } else if (input.impact === 'medium') {
    score += 12;
  } else if (input.impact === 'low') {
    score += 4;
  }

  const historical = input.historicalRelevance != null
    ? Math.round(input.historicalRelevance * 20)
    : KIND_HISTORICAL[input.kind] ?? 4;
  score += historical;
  if (historical >= 14) {
    reasons.push('Historically a widely studied event type in markets education.');
  }

  const scope = input.marketScope != null ? Math.round(input.marketScope * 18) : KIND_SCOPE[input.kind] ?? 6;
  if (input.countryCode === 'US' || input.countryCode === 'EU') {
    score += 4;
  }
  score += scope;
  if (scope >= 12) {
    reasons.push('Can affect many asset classes at once (market scope).');
  }

  const vol = input.volatilityPotential != null
    ? Math.round(input.volatilityPotential * 16)
    : KIND_VOL[input.kind] ?? 5;
  score += vol;
  if (vol >= 12) {
    reasons.push('Often associated with wider ranges — volatility potential, not a predicted direction.');
  }

  const topics = input.preferredTopics ?? [];
  if (topics.some((topic) => TOPIC_KIND[topic]?.includes(input.kind))) {
    score += 8;
    reasons.push('Matches a current learning goal.');
  }

  if (input.weakness && WEAKNESS_KIND[input.weakness]?.includes(input.kind)) {
    score += 8;
    reasons.push(`Touches a current area to improve: ${input.weakness.replace(/_/g, ' ')}.`);
  }

  if ((input.struggles ?? []).some((struggle) => STRUGGLE_KIND[struggle]?.includes(input.kind))) {
    score += 5;
    reasons.push('Relevant to a risk or process struggle you named.');
  }

  if (input.lifecycle === 'upcoming' && score >= 40) {
    score += 6;
    reasons.push('Still ahead — useful for preparation, not for a signal.');
  }
  if (input.lifecycle === 'developing') {
    score += 5;
    reasons.push('Still developing — information is incomplete.');
  }

  if (reasons.length === 0) {
    reasons.push('Scored from historical relevance, scope, and volatility potential — not media heat.');
  }

  return { score: clamp(score), reasons };
}
