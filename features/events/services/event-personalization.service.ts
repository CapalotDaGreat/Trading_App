import type { CompetencyMasteryState } from '@/features/competency';
import { DRILL_TO_CONCEPT } from '@/features/learning-engine/content/learning-graph';
import type { MentorExperienceLevel, TradingStruggle } from '@/features/onboarding/types/mentor-setup.types';
import type { SkillDomain } from '@/shared/constants/skill-domains';

import type { EventTrainingPlan, MarketEventCardModel, MarketEventKind } from '../types/events.types';
import { selectUpcomingStudyEvent } from './event-calendar.service';
import { mappingForEventKind } from './event-concept.service';
import { simulationHrefForEventKind } from './event-simulation.service';

const ADVANCED: MentorExperienceLevel[] = ['advanced', 'professional'];

const WEAKNESS_TO_CONCEPTS: Partial<Record<SkillDomain, string[]>> = {
  risk_management: ['event-volatility', 'volatility-aware-risk', 'position-sizing'],
  decision_making: ['uncertainty', 'scenario-thinking', 'event-risk'],
  fundamental_analysis: ['event-risk', 'earnings-events', 'inflation', 'interest-rates'],
  psychology: ['recency-bias', 'overconfidence', 'fomo'],
  portfolio_management: ['concentration-risk', 'diversification'],
  market_understanding: ['event-risk', 'interest-rates', 'fx'],
};

const STRUGGLE_TO_CONCEPTS: Partial<Record<TradingStruggle, string[]>> = {
  risk_management: ['event-volatility', 'volatility-aware-risk', 'position-sizing'],
  emotions: ['emotional-decision-making', 'recency-bias'],
  fomo: ['fomo', 'event-volatility'],
  overtrading: ['position-sizing', 'event-risk'],
};

const GAP_COPY: Record<string, string> = {
  'event-volatility': 'volatility management needs work',
  'volatility-aware-risk': 'volatility management needs work',
  uncertainty: 'scenario planning under uncertainty needs work',
  'scenario-thinking': 'scenario planning under uncertainty needs work',
  'event-risk': 'event-risk preparation needs work',
  'earnings-events': 'earnings-event process needs work',
  'recency-bias': 'not overweighting the last print needs work',
  overconfidence: 'confidence calibration around events needs work',
  fomo: 'staying off the first impulse needs work',
  'position-sizing': 'sizing around event risk needs work',
  inflation: 'inflation-event process needs work',
  'interest-rates': 'rate-decision preparation needs work',
  'central-bank': 'rate-decision preparation needs work',
};

const APPROACHING: Partial<Record<MarketEventKind, string>> = {
  inflation: 'CPI is approaching.',
  interest_rate: 'A central-bank decision is approaching.',
  employment: 'An employment report is approaching.',
  earnings: 'Earnings are approaching.',
  gdp: 'A growth print is approaching.',
};

export function isEventPersonalizationEligible(experience: MentorExperienceLevel | null | undefined): boolean {
  return experience != null && ADVANCED.includes(experience);
}

export function collectPracticeGapConceptIds(input: {
  attempts?: Array<{ drillId: string; correct: boolean }>;
  mastery?: Array<{ conceptId: string; state: CompetencyMasteryState }>;
}): string[] {
  const ids = new Set<string>();
  for (const attempt of input.attempts ?? []) {
    if (attempt.correct) continue;
    const concept = DRILL_TO_CONCEPT[attempt.drillId];
    if (concept) ids.add(concept);
  }
  for (const row of input.mastery ?? []) {
    if (row.state === 'needs_remediation' || row.state === 'due_for_redemonstration') {
      ids.add(row.conceptId);
    }
  }
  return [...ids];
}

function gapIdsForProfile(input: {
  gapConceptIds?: string[];
  weakness?: SkillDomain | null;
  struggles?: TradingStruggle[];
}): string[] {
  const ids = new Set(input.gapConceptIds ?? []);
  if (input.weakness) {
    for (const id of WEAKNESS_TO_CONCEPTS[input.weakness] ?? []) ids.add(id);
  }
  for (const struggle of input.struggles ?? []) {
    for (const id of STRUGGLE_TO_CONCEPTS[struggle] ?? []) ids.add(id);
  }
  return [...ids];
}

function pickGap(eventKind: MarketEventKind, gapIds: string[]): { conceptId: string; note: string } | null {
  const mapping = mappingForEventKind(eventKind);
  const eventSet = new Set([...mapping.conceptIds, ...mapping.riskConceptIds, ...mapping.psychologyConceptIds]);
  const hit = gapIds.find((id) => eventSet.has(id));
  if (!hit) return null;
  return { conceptId: hit, note: GAP_COPY[hit] ?? 'this process still needs practice' };
}

function approachingHeadline(card: MarketEventCardModel, daysUntil: number): string {
  if (daysUntil === 0) {
    if (card.kind === 'inflation') return 'CPI is today.';
    return `${card.title} is today.`;
  }
  return APPROACHING[card.kind] ?? `${card.title} is approaching.`;
}

export function composeEventTrainingPlan(input: {
  cards: MarketEventCardModel[];
  experience: MentorExperienceLevel | null | undefined;
  now?: number;
  weakness?: SkillDomain | null;
  struggles?: TradingStruggle[];
  gapConceptIds?: string[];
}): EventTrainingPlan | null {
  if (!isEventPersonalizationEligible(input.experience)) return null;

  const now = input.now ?? Date.now();
  const lead = selectUpcomingStudyEvent(input.cards, now);
  if (!lead) return null;

  const daysUntil = Math.max(0, Math.round((lead.scheduledAt - now) / (24 * 60 * 60 * 1000)));
  if (daysUntil > 10) return null;

  const gap = pickGap(lead.kind, gapIdsForProfile(input));
  const highVol = gap?.conceptId === 'event-volatility' || gap?.conceptId === 'volatility-aware-risk';
  const simulateHref = highVol
    ? simulationHrefForEventKind(lead.kind, { highVolatility: true, prep: lead.training.simulatePrep })
    : lead.training.simulateHref;

  const lessonIsGapEventRisk = gap?.conceptId === 'event-risk' || gap?.conceptId === 'event-volatility';
  const lessonTitle = lessonIsGapEventRisk ? 'Event Risk lesson' : lead.training.lessonTitle;
  const lessonHref = lessonIsGapEventRisk
    ? '/academy/lesson/fund-calendar'
    : `/academy/lesson/${lead.training.lessonId}`;

  const practiceGapNote = gap
    ? `Your recent practice shows that ${gap.note}.`
    : null;

  return {
    headline: approachingHeadline(lead, daysUntil),
    eventTitle: lead.title,
    eventKind: lead.kind,
    daysUntil,
    practiceGapNote,
    gapConceptId: gap?.conceptId ?? null,
    lessonTitle,
    lessonHref,
    practiceTitle: lead.training.practiceTitle,
    practiceHref: lead.training.practiceHref,
    replayTitle: lead.training.replayTitle,
    replayHref: lead.training.replayHref,
    simulateTitle: highVol ? 'High-volatility simulation' : lead.training.simulateTitle,
    simulateHref,
    reminder:
      'This is training personalization, not a trade alert. Recommended: a short Event Risk lesson, a historical replay, then a fictional simulation. Possible paths are scenarios — not a prediction of this event.',
  };
}
