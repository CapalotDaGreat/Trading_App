import type { CompetencyMastery } from '@/features/competency';
import type { EconomicEvent } from '@/features/calendar/services/economic-calendar.service';
import type { LearningTopic } from '@/shared/constants/learning-topics';
import type { SkillDomain } from '@/shared/constants/skill-domains';
import type { MentorExperienceLevel, TradingStruggle } from '@/features/onboarding/types/mentor-setup.types';
import { EVENT_KIND_LABELS } from '../content/event-education';
import { listCuratedMarketStories } from '../content/event-stories';
import type {
  MarketEventCardModel,
  MarketEventFreshness,
  MarketEventHub,
  MarketEventLifecycle,
} from '../types/events.types';
import { educationForKind, kindFromCalendarEvent, trainingFromEducation } from './event-education.service';
import { scoreEventImportance } from './event-importance.service';
import { composeEventTrainingPlan } from './event-personalization.service';
import { selectBeginnerLearningCalendar } from './event-calendar.service';
import { freshnessForSource, lifecycleForEvent, whatHappenedOrExpected } from './event-status.service';

export interface ComposeMarketEventHubInput {
  calendarEvents: EconomicEvent[];
  calendarUnavailable: boolean;
  fetchedAt: number;
  fromCache?: boolean;
  now?: number;
  experience?: MentorExperienceLevel | null;
  preferredTopics?: LearningTopic[];
  struggles?: TradingStruggle[];
  weakness?: SkillDomain | null;
  gapConceptIds?: string[];
  mastery?: Array<Pick<CompetencyMastery, 'conceptId' | 'state' | 'competenceState' | 'falseMastery'>>;
}

function calendarCard(
  event: EconomicEvent,
  input: ComposeMarketEventHubInput,
  freshness: { kind: MarketEventFreshness; note: string },
): MarketEventCardModel {
  const kind = kindFromCalendarEvent(event);
  const education = educationForKind(kind);
  const lifecycle = lifecycleForEvent({
    scheduledAt: event.scheduledAt,
    actual: event.actual,
    now: input.now,
  });
  return {
    id: `cal-${event.id}`,
    title: event.title,
    scheduledAt: event.scheduledAt,
    lifecycle,
    kind,
    categoryLabel: EVENT_KIND_LABELS[kind],
    importance: scoreEventImportance({
      kind,
      title: event.title,
      impact: event.impact,
      lifecycle,
      countryCode: event.countryCode,
      preferredTopics: input.preferredTopics,
      weakness: input.weakness,
      struggles: input.struggles,
    }),
    whatHappenedOrExpected: whatHappenedOrExpected({
      lifecycle,
      actual: event.actual,
      forecast: event.forecast,
      previous: event.previous,
      fallback: education.whyTradersCare,
    }),
    whyMarketsMayCare: education.whyTradersCare,
    relatedAssets: education.relatedAssets,
    relatedSectors: education.relatedSectors,
    training: trainingFromEducation(education),
    articles: education.articles,
    country: event.country,
    countryCode: event.countryCode,
    forecast: event.forecast,
    previous: event.previous,
    actual: event.actual,
    freshness: {
      kind: freshness.kind,
      fetchedAt: input.fetchedAt,
      note: freshness.note,
    },
    origin: 'calendar',
  };
}

function storyCard(
  story: ReturnType<typeof listCuratedMarketStories>[number],
  input: ComposeMarketEventHubInput,
  fetchedAt: number,
): MarketEventCardModel {
  const education = educationForKind(story.kind);
  const lifecycle = story.lifecycle;
  return {
    id: story.id,
    title: story.title,
    scheduledAt: story.scheduledAt,
    lifecycle,
    kind: story.kind,
    categoryLabel: EVENT_KIND_LABELS[story.kind],
    importance: scoreEventImportance({
      kind: story.kind,
      title: story.title,
      lifecycle,
      countryCode: story.countryCode,
      historicalRelevance: story.historicalRelevance,
      marketScope: story.marketScope,
      volatilityPotential: story.volatilityPotential,
      preferredTopics: input.preferredTopics,
      weakness: input.weakness,
      struggles: input.struggles,
    }),
    whatHappenedOrExpected: story.whatHappenedOrExpected,
    whyMarketsMayCare: story.whyMarketsMayCare,
    relatedAssets: story.relatedAssets,
    relatedSectors: story.relatedSectors,
    training: trainingFromEducation(education),
    articles: story.articles.length ? story.articles : education.articles,
    country: story.country,
    countryCode: story.countryCode,
    freshness: {
      kind: 'sample',
      fetchedAt,
      note: 'Labelled educational story. Not a live news wire.',
    },
    origin: 'curated',
  };
}

export function composeMarketEventHub(input: ComposeMarketEventHubInput): MarketEventHub {
  const now = input.now ?? Date.now();
  const calendarFreshness = freshnessForSource({
    source: input.calendarEvents[0]?.source,
    fromCache: input.fromCache,
  });
  const calendarCards = input.calendarEvents.map((event) => calendarCard(event, input, calendarFreshness));
  const stories = listCuratedMarketStories(now).map((story) => storyCard(story, input, input.fetchedAt));
  const cards = [...calendarCards, ...stories].sort(
    (a, b) => b.importance.score - a.importance.score || a.scheduledAt - b.scheduledAt,
  );

  const briefing =
    cards.find((card) => card.lifecycle === 'upcoming' && card.origin === 'calendar') ??
    cards.find((card) => card.lifecycle === 'developing') ??
    cards.find((card) => card.lifecycle === 'upcoming') ??
    cards[0] ??
    null;

  const freshnessNote = input.calendarUnavailable
    ? 'Market Events are temporarily unavailable for the live calendar. Educational stories below still work. The rest of TradeAcademy is unaffected.'
    : calendarFreshness.note;

  return {
    cards,
    briefing,
    trainingPlan: composeEventTrainingPlan({
      cards,
      experience: input.experience,
      now,
      weakness: input.weakness,
      struggles: input.struggles,
      gapConceptIds: input.gapConceptIds,
      mastery: input.mastery,
    }),
    learningCalendar: selectBeginnerLearningCalendar(cards),
    calendarUnavailable: input.calendarUnavailable,
    freshnessNote,
    fetchedAt: input.fetchedAt,
  };
}

export function cardsForLifecycle(
  cards: MarketEventCardModel[],
  lifecycle: MarketEventLifecycle,
): MarketEventCardModel[] {
  return cards
    .filter((card) => card.lifecycle === lifecycle)
    .sort((a, b) => (lifecycle === 'historical' ? b.scheduledAt - a.scheduledAt : a.scheduledAt - b.scheduledAt));
}
