import type { EconomicEvent, EventCategory } from '@/features/calendar/services/economic-calendar.service';
import { EVENT_EDUCATION, type EventEducation } from '../content/event-education';
import type { MarketEventKind, MarketEventTraining } from '../types/events.types';

const CALENDAR_KINDS = new Set<MarketEventKind>([
  'employment',
  'inflation',
  'gdp',
  'interest_rate',
  'manufacturing',
  'consumer',
  'housing',
  'trade',
  'other',
]);

export function kindFromTitle(title: string, fallback: MarketEventKind = 'other'): MarketEventKind {
  const lower = title.toLowerCase();
  if (lower.includes('fomc') || lower.includes('fed ') || lower.includes('interest rate') || lower.includes('rate decision')) {
    return 'interest_rate';
  }
  if (lower.includes('cpi') || lower.includes('pce') || lower.includes('inflation')) return 'inflation';
  if (lower.includes('payroll') || lower.includes('nfp') || lower.includes('employment') || lower.includes('jobless')) {
    return 'employment';
  }
  if (lower.includes('gdp')) return 'gdp';
  if (lower.includes('earnings') || lower.includes('eps') || lower.includes('10-q') || lower.includes('8-k')) {
    return 'earnings';
  }
  if (lower.includes('merger') || lower.includes('guidance') || lower.includes('acquisition')) return 'corporate';
  if (lower.includes('sanction') || lower.includes('war') || lower.includes('referendum') || lower.includes('geopolit')) {
    return 'geopolitical';
  }
  if (lower.includes('sec ') || lower.includes('regulat') || lower.includes('antitrust')) return 'regulatory';
  return fallback;
}

export function kindFromCalendarEvent(event: Pick<EconomicEvent, 'title' | 'category'>): MarketEventKind {
  const fromTitle = kindFromTitle(event.title, 'other');
  if (fromTitle !== 'other') return fromTitle;
  return CALENDAR_KINDS.has(event.category as MarketEventKind) ? (event.category as MarketEventKind) : 'other';
}

export function educationForKind(kind: MarketEventKind): EventEducation {
  return EVENT_EDUCATION[kind] ?? EVENT_EDUCATION.other;
}

export function educationForCategory(category: EventCategory): EventEducation {
  return educationForKind(category);
}

export function educationForEvent(event: EconomicEvent): EventEducation {
  return educationForKind(kindFromCalendarEvent(event));
}

export function trainingFromEducation(education: EventEducation): MarketEventTraining {
  return {
    concepts: education.concepts,
    conceptIds: education.conceptIds,
    riskConceptIds: education.riskConceptIds,
    psychologyConceptIds: education.psychologyConceptIds,
    lessonId: education.relatedLessonId,
    lessonTitle: education.relatedLessonTitle,
    practiceId: education.practiceId,
    practiceTitle: education.practiceTitle,
    practicePrompt: education.practicePrompt,
    practiceHref: education.practiceHref,
    replayId: education.replayId,
    replayTitle: education.replayTitle,
    replayHref: education.replayHref,
    simulatePrep: education.simulatePrep,
    simulateTitle: education.simulateTitle,
    simulateHref: education.simulateHref,
  };
}

export function eventTrainingCopy(event: EconomicEvent): string {
  const education = educationForEvent(event);
  return `${education.whyTradersCare} This is preparation, not a buy/sell instruction.`;
}
