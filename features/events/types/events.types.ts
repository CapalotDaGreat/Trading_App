/**
 * Shared event metadata. Academy, Practice, Replay, and Simulation
 * consume this — they do not import calendar vendors.
 */

export type MarketEventKind =
  | 'interest_rate'
  | 'inflation'
  | 'employment'
  | 'gdp'
  | 'earnings'
  | 'corporate'
  | 'geopolitical'
  | 'regulatory'
  | 'manufacturing'
  | 'consumer'
  | 'housing'
  | 'trade'
  | 'other';

export type MarketEventLifecycle = 'upcoming' | 'released' | 'developing' | 'historical';

export type MarketEventFreshness = 'delayed' | 'sample' | 'cached' | 'approximate';

export interface MarketEventArticle {
  headline: string;
  source: string;
  date: string;
  summary: string;
  whyItMatters: string;
  url: string;
}

export interface MarketEventTraining {
  /** User-facing educational labels (inflation, event risk, …). */
  concepts: string[];
  /** Canonical competency IDs. Event → concepts → lessons / practice / replay / sim. */
  conceptIds: string[];
  riskConceptIds: string[];
  psychologyConceptIds: string[];
  lessonId: string;
  lessonTitle: string;
  practiceId?: string;
  practiceTitle: string;
  practicePrompt: string;
  practiceHref: string;
  replayId?: string;
  replayTitle: string;
  replayHref: string;
  simulatePrep?: 'rates' | 'inflation' | 'employment' | 'earnings' | 'macro';
  simulateTitle: string;
  simulateHref: string;
}

export interface MarketEventImportance {
  score: number;
  reasons: string[];
}

export interface MarketEventCardModel {
  id: string;
  title: string;
  scheduledAt: number;
  lifecycle: MarketEventLifecycle;
  kind: MarketEventKind;
  categoryLabel: string;
  importance: MarketEventImportance;
  whatHappenedOrExpected: string;
  whyMarketsMayCare: string;
  relatedAssets: string[];
  relatedSectors: string[];
  training: MarketEventTraining;
  articles: MarketEventArticle[];
  country?: string;
  countryCode?: string;
  forecast?: string;
  previous?: string;
  actual?: string;
  freshness: {
    kind: MarketEventFreshness;
    fetchedAt: number;
    note: string;
  };
  origin: 'calendar' | 'curated';
}

export interface EventTrainingPlan {
  headline: string;
  eventTitle: string;
  eventKind: MarketEventKind;
  daysUntil: number | null;
  /** Recent practice / competency gap that overlaps this event. Training, not a trade alert. */
  practiceGapNote: string | null;
  gapConceptId: string | null;
  lessonTitle: string;
  lessonHref: string;
  practiceTitle: string;
  practiceHref: string;
  replayTitle: string;
  replayHref: string;
  simulateTitle: string;
  simulateHref: string;
  reminder: string;
}

export type EventPrepKind = NonNullable<MarketEventTraining['simulatePrep']>;

export interface CuratedMarketStory {
  id: string;
  title: string;
  kind: MarketEventKind;
  lifecycle: MarketEventLifecycle;
  /** Absolute time, or a millisecond offset from `now` when listed. */
  scheduledAt: number;
  whatHappenedOrExpected: string;
  whyMarketsMayCare: string;
  relatedAssets: string[];
  relatedSectors: string[];
  country?: string;
  countryCode?: string;
  articles: MarketEventArticle[];
  historicalRelevance: number;
  marketScope: number;
  volatilityPotential: number;
}

export interface MarketEventHub {
  cards: MarketEventCardModel[];
  briefing: MarketEventCardModel | null;
  trainingPlan: EventTrainingPlan | null;
  /** Curated learning calendar for beginners — not a news stream. */
  learningCalendar: MarketEventCardModel[];
  calendarUnavailable: boolean;
  freshnessNote: string;
  fetchedAt: number;
}
