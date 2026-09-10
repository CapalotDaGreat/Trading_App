import { LEARNING_CALENDAR_KINDS } from '../content/event-concept-map';
import type { MarketEventCardModel } from '../types/events.types';

const DAY = 24 * 60 * 60 * 1000;
const BEGINNER_CALENDAR_CAP = 5;
const DEFAULT_HORIZON_DAYS = 10;

const LEARNING_KIND_SET = new Set<string>(LEARNING_CALENDAR_KINDS);

export function selectUpcomingStudyEvent(
  cards: MarketEventCardModel[],
  now = Date.now(),
  horizonDays = DEFAULT_HORIZON_DAYS,
): MarketEventCardModel | null {
  const horizon = now + horizonDays * DAY;
  const upcoming = cards.filter(
    (card) => card.lifecycle === 'upcoming' && card.scheduledAt >= now - 6 * 60 * 60 * 1000 && card.scheduledAt <= horizon,
  );
  const rank = (a: MarketEventCardModel, b: MarketEventCardModel) =>
    b.importance.score - a.importance.score || a.scheduledAt - b.scheduledAt;
  const fromCalendar = upcoming.filter((card) => card.origin === 'calendar').sort(rank)[0];
  if (fromCalendar) return fromCalendar;
  return upcoming.sort(rank)[0] ?? null;
}

/**
 * Beginner Market Events is a learning calendar: a few study objects,
 * not a high-frequency news stream. Developing / low-impact flood is excluded.
 */
export function selectBeginnerLearningCalendar(
  cards: MarketEventCardModel[],
): MarketEventCardModel[] {
  const upcoming = cards
    .filter((card) => card.lifecycle === 'upcoming')
    .filter((card) => LEARNING_KIND_SET.has(card.kind))
    .filter((card) => card.origin === 'curated' || card.importance.score >= 40)
    .sort((a, b) => a.scheduledAt - b.scheduledAt || b.importance.score - a.importance.score)
    .slice(0, 4);

  const historical = cards
    .filter((card) => card.lifecycle === 'historical' && card.origin === 'curated')
    .filter((card) => LEARNING_KIND_SET.has(card.kind) || card.kind === 'geopolitical')
    .sort((a, b) => b.scheduledAt - a.scheduledAt)
    .slice(0, 2);

  const seen = new Set<string>();
  const out: MarketEventCardModel[] = [];
  for (const card of [...upcoming, ...historical]) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    out.push(card);
    if (out.length >= BEGINNER_CALENDAR_CAP) break;
  }

  if (out.length === 0) {
    return cards
      .filter((card) => card.origin === 'curated' && card.lifecycle !== 'developing')
      .sort((a, b) => a.scheduledAt - b.scheduledAt)
        .slice(0, BEGINNER_CALENDAR_CAP);
  }

  return out;
}

export function isBeginnerEventExperience(experience: string | null | undefined): boolean {
  return !experience || experience === 'completely_new' || experience === 'beginner';
}
