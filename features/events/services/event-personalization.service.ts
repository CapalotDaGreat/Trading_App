import type { CompetenceState, CompetencyMastery, CompetencyMasteryState } from '@/features/competency';
import { DRILL_TO_CONCEPT } from '@/features/learning-engine/content/learning-graph';
import type { MentorExperienceLevel, TradingStruggle } from '@/features/onboarding/types/mentor-setup.types';
import type { SkillDomain } from '@/shared/constants/skill-domains';

import type {
  EventTrainingIntent,
  EventTrainingPlan,
  EventTrainingPrimary,
  MarketEventCardModel,
  MarketEventKind,
} from '../types/events.types';
import { selectUpcomingStudyEvent } from './event-calendar.service';
import { mappingForEventKind } from './event-concept.service';
import { simulationHrefForEventKind } from './event-simulation.service';

const ADVANCED: MentorExperienceLevel[] = ['advanced', 'professional'];

const WEAK_STATES = new Set<CompetenceState>([
  'needs_revisit',
  'transfer_unproven',
  'developing',
  'learning',
]);

const STRONG_STATES = new Set<CompetenceState>(['demonstrated', 'strong']);

const EVENT_RISK_IDS = ['event-risk', 'event-volatility'] as const;
const UNCERTAINTY_IDS = ['uncertainty', 'scenario-thinking', 'fundamental-uncertainty'] as const;
const FUNDAMENTALS_IDS = [
  'earnings',
  'revenue-growth',
  'valuation',
  'inflation',
  'interest-rates',
  'economic-releases',
] as const;

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
  'fundamental-uncertainty': 'scenario planning under uncertainty needs work',
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

export interface EventMasteryRow {
  conceptId: string;
  state: CompetencyMasteryState;
  competenceState?: CompetenceState;
  falseMastery?: boolean;
}

export function isEventPersonalizationEligible(experience: MentorExperienceLevel | null | undefined): boolean {
  return experience != null && ADVANCED.includes(experience);
}

export function collectPracticeGapConceptIds(input: {
  attempts?: Array<{ drillId: string; correct: boolean }>;
  mastery?: EventMasteryRow[];
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
    if (row.competenceState && WEAK_STATES.has(row.competenceState)) {
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

function rowFor(rows: EventMasteryRow[], conceptId: string): EventMasteryRow | undefined {
  return rows.find((item) => item.conceptId === conceptId);
}

function isWeak(rows: EventMasteryRow[], conceptId: string): boolean {
  const row = rowFor(rows, conceptId);
  if (!row) return false;
  if (row.competenceState && WEAK_STATES.has(row.competenceState)) return true;
  return row.state === 'needs_remediation' || row.state === 'due_for_redemonstration';
}

function isStrong(rows: EventMasteryRow[], conceptId: string): boolean {
  const row = rowFor(rows, conceptId);
  if (!row?.competenceState) return false;
  return STRONG_STATES.has(row.competenceState);
}

function anyWeak(rows: EventMasteryRow[], ids: readonly string[]): boolean {
  return ids.some((id) => isWeak(rows, id));
}

function anyStrong(rows: EventMasteryRow[], ids: readonly string[]): boolean {
  return ids.some((id) => isStrong(rows, id));
}

function applicationWeak(rows: EventMasteryRow[], ids: readonly string[]): boolean {
  return ids.some((id) => {
    const row = rowFor(rows, id);
    if (!row) return false;
    return row.falseMastery === true || row.competenceState === 'transfer_unproven';
  });
}

export function resolveEventTrainingIntent(input: {
  eventKind: MarketEventKind;
  mastery?: EventMasteryRow[];
  gapIds?: string[];
}): { intent: EventTrainingIntent; conceptId: string | null; note: string | null } {
  const rows = input.mastery ?? [];
  const mapping = mappingForEventKind(input.eventKind);
  const eventSet = new Set([...mapping.conceptIds, ...mapping.riskConceptIds, ...mapping.psychologyConceptIds]);
  const gapIds = (input.gapIds ?? []).filter((id) => eventSet.has(id));

  const eventRiskWeak =
    anyWeak(rows, EVENT_RISK_IDS) || gapIds.includes('event-risk') || gapIds.includes('event-volatility');
  if (eventRiskWeak) {
    const conceptId = EVENT_RISK_IDS.find((id) => isWeak(rows, id) || gapIds.includes(id)) ?? 'event-risk';
    return { intent: 'event_risk_lesson', conceptId, note: GAP_COPY[conceptId] ?? GAP_COPY['event-risk']! };
  }

  const uncertaintyWeak =
    anyWeak(rows, UNCERTAINTY_IDS) ||
    gapIds.includes('uncertainty') ||
    gapIds.includes('scenario-thinking') ||
    gapIds.includes('fundamental-uncertainty');
  if (anyStrong(rows, EVENT_RISK_IDS) && uncertaintyWeak) {
    const conceptId = UNCERTAINTY_IDS.find((id) => isWeak(rows, id) || gapIds.includes(id)) ?? 'uncertainty';
    return { intent: 'uncertainty_exercise', conceptId, note: GAP_COPY[conceptId] ?? GAP_COPY.uncertainty! };
  }

  if (anyStrong(rows, FUNDAMENTALS_IDS) && applicationWeak(rows, FUNDAMENTALS_IDS)) {
    const conceptId = FUNDAMENTALS_IDS.find((id) => applicationWeak(rows, [id])) ?? 'earnings';
    return {
      intent: 'fundamentals_application',
      conceptId,
      note: 'applying fundamentals around a live-style event still needs work',
    };
  }

  const hit = gapIds[0];
  if (hit) {
    return { intent: 'general_prep', conceptId: hit, note: GAP_COPY[hit] ?? 'this process still needs practice' };
  }

  return { intent: 'general_prep', conceptId: null, note: null };
}

function approachingHeadline(card: MarketEventCardModel, daysUntil: number): string {
  if (daysUntil === 0) {
    if (card.kind === 'inflation') return 'CPI is today.';
    return `${card.title} is today.`;
  }
  return APPROACHING[card.kind] ?? `${card.title} is approaching.`;
}

function applyIntent(
  lead: MarketEventCardModel,
  intent: EventTrainingIntent,
): Pick<
  EventTrainingPlan,
  | 'lessonTitle'
  | 'lessonHref'
  | 'practiceTitle'
  | 'practiceHref'
  | 'replayTitle'
  | 'replayHref'
  | 'simulateTitle'
  | 'simulateHref'
  | 'primary'
> {
  const base = {
    lessonTitle: lead.training.lessonTitle,
    lessonHref: `/academy/lesson/${lead.training.lessonId}`,
    practiceTitle: lead.training.practiceTitle,
    practiceHref: lead.training.practiceHref,
    replayTitle: lead.training.replayTitle,
    replayHref: lead.training.replayHref,
    simulateTitle: lead.training.simulateTitle,
    simulateHref: lead.training.simulateHref,
    primary: 'lesson' as EventTrainingPrimary,
  };

  if (intent === 'event_risk_lesson') {
    return {
      ...base,
      lessonTitle: 'Event Risk lesson',
      lessonHref: '/academy/lesson/fund-calendar',
      primary: 'lesson',
    };
  }
  if (intent === 'uncertainty_exercise') {
    return {
      ...base,
      lessonTitle: 'Deciding when information is incomplete',
      lessonHref: '/academy/lesson/dec-uncertainty',
      practiceTitle: 'Uncertainty-focused event exercise',
      practiceHref: '/practice?drill=rate-decision-uncertainty',
      primary: 'practice',
    };
  }
  if (intent === 'fundamentals_application') {
    return {
      ...base,
      practiceTitle: 'Event-driven fundamentals practice',
      practiceHref: '/practice?topic=fundamentals',
      simulateTitle: 'Event-driven fundamentals scenario',
      simulateHref: lead.training.simulateHref.includes('prep=')
        ? lead.training.simulateHref
        : '/simulate?start=1&prep=earnings',
      primary: 'simulate',
    };
  }
  return base;
}

export function composeEventTrainingPlan(input: {
  cards: MarketEventCardModel[];
  experience: MentorExperienceLevel | null | undefined;
  now?: number;
  weakness?: SkillDomain | null;
  struggles?: TradingStruggle[];
  gapConceptIds?: string[];
  mastery?: Array<EventMasteryRow | Pick<CompetencyMastery, 'conceptId' | 'state' | 'competenceState' | 'falseMastery'>>;
}): EventTrainingPlan | null {
  if (!isEventPersonalizationEligible(input.experience)) return null;

  const now = input.now ?? Date.now();
  const lead = selectUpcomingStudyEvent(input.cards, now);
  if (!lead) return null;

  const daysUntil = Math.max(0, Math.round((lead.scheduledAt - now) / (24 * 60 * 60 * 1000)));
  if (daysUntil > 10) return null;

  const mastery: EventMasteryRow[] = (input.mastery ?? []).map((item) => ({
    conceptId: item.conceptId,
    state: item.state,
    competenceState: 'competenceState' in item ? item.competenceState : undefined,
    falseMastery: 'falseMastery' in item ? item.falseMastery : undefined,
  }));

  const resolved = resolveEventTrainingIntent({
    eventKind: lead.kind,
    mastery,
    gapIds: gapIdsForProfile(input),
  });
  const applied = applyIntent(lead, resolved.intent);
  const highVol = resolved.conceptId === 'event-volatility' || resolved.conceptId === 'volatility-aware-risk';
  const simulateHref = highVol
    ? simulationHrefForEventKind(lead.kind, { highVolatility: true, prep: lead.training.simulatePrep })
    : applied.simulateHref;
  const simulateTitle = highVol ? 'High-volatility simulation' : applied.simulateTitle;

  return {
    headline: approachingHeadline(lead, daysUntil),
    eventTitle: lead.title,
    eventKind: lead.kind,
    daysUntil,
    intent: resolved.intent,
    primary: applied.primary,
    practiceGapNote: resolved.note ? `Your recent practice shows that ${resolved.note}.` : null,
    gapConceptId: resolved.conceptId,
    lessonTitle: applied.lessonTitle,
    lessonHref: applied.lessonHref,
    practiceTitle: applied.practiceTitle,
    practiceHref: applied.practiceHref,
    replayTitle: applied.replayTitle,
    replayHref: applied.replayHref,
    simulateTitle,
    simulateHref,
    reminder:
      'This is training personalization, not a trade alert. Recommended: a related lesson, an event-aware replay, a practice drill, then a fictional simulation. Possible paths are scenarios — not a prediction of this event.',
  };
}
