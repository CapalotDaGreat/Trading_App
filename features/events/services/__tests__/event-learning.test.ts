import { resolveCompetencyId } from '@/features/competency';

import { EVENT_CONCEPT_MAP, LEARNING_CALENDAR_KINDS } from '../../content/event-concept-map';
import { EVENT_EDUCATION } from '../../content/event-education';
import { listCuratedMarketStories } from '../../content/event-stories';
import { allArticlesAttributed, checkSourceAttribution } from '../event-attribution.service';
import { selectBeginnerLearningCalendar, selectUpcomingStudyEvent } from '../event-calendar.service';
import { eventConceptChain, mappingForEventKind } from '../event-concept.service';
import { educationForKind } from '../event-education.service';
import { composeMarketEventHub } from '../event-hub.service';
import {
  collectPracticeGapConceptIds,
  composeEventTrainingPlan,
  isEventPersonalizationEligible,
  resolveEventTrainingIntent,
} from '../event-personalization.service';
import { generateEventAwareSimulation } from '../event-simulation.service';
import { freshnessForSource, isStaleCalendarSnapshot } from '../event-status.service';
import type { MarketEventKind } from '../../types/events.types';

const NOW = Date.parse('2026-09-10T12:00:00.000Z');
const NOW_ISO = '2026-09-10T12:00:00.000Z';

const PREDICTION =
  /buy this|sell this|short this|should buy|should sell|guaranteed|buy now|sell now|buy before earnings|sell before the fed|cpi will cause|stocks will fall|stocks will rise|price target|expected price|enter now|this is a signal|long this/i;

const KINDS = Object.keys(EVENT_CONCEPT_MAP) as MarketEventKind[];

const cpi = {
  id: 'us-cpi',
  title: 'CPI',
  country: 'United States',
  countryCode: 'US',
  category: 'inflation' as const,
  impact: 'high' as const,
  forecast: '+0.2%',
  scheduledAt: NOW + 3 * 86400000,
  source: 'mock' as const,
};

const fomc = {
  id: 'us-fomc',
  title: 'FOMC rate decision',
  country: 'United States',
  countryCode: 'US',
  category: 'interest_rate' as const,
  impact: 'high' as const,
  forecast: 'Hold',
  scheduledAt: NOW + 3 * 86400000,
  source: 'mock' as const,
};

describe('event-to-concept mapping', () => {
  it('maps every event category onto resolvable competency IDs', () => {
    for (const kind of KINDS) {
      const chain = eventConceptChain(kind);
      expect(chain.conceptIds.length).toBeGreaterThan(0);
      for (const id of chain.conceptIds) {
        expect(resolveCompetencyId(id)).toBe(id);
      }
      expect(chain.riskConceptIds.length).toBeGreaterThan(0);
      expect(chain.psychologyConceptIds.length).toBeGreaterThan(0);
      expect(educationForKind(kind).conceptIds).toEqual(expect.arrayContaining(mappingForEventKind(kind).conceptIds));
      expect(educationForKind(kind).relatedLessonId).toBeTruthy();
      expect(educationForKind(kind).practiceHref).toContain('/practice');
      expect(educationForKind(kind).practiceHref).toContain('concept=');
      expect(educationForKind(kind).practiceHref).toContain('loop=');
      expect(educationForKind(kind).replayHref).toContain('/decision/replay');
      expect(educationForKind(kind).replayHref).toContain('concept=');
      expect(educationForKind(kind).simulateHref).toContain('/simulate');
      expect(educationForKind(kind).simulateHref).toContain('concept=');
    }
  });

  it('links CPI, earnings, and central-bank decisions to the required concept families', () => {
    expect(EVENT_CONCEPT_MAP.inflation.displayConcepts).toEqual(
      expect.arrayContaining(['inflation', 'event risk', 'volatility', 'uncertainty', 'scenario planning']),
    );
    expect(EVENT_CONCEPT_MAP.inflation.conceptIds).toEqual(
      expect.arrayContaining(['inflation', 'event-risk', 'event-volatility', 'uncertainty', 'scenario-thinking']),
    );
    expect(EVENT_CONCEPT_MAP.earnings.displayConcepts).toEqual(
      expect.arrayContaining(['revenue', 'earnings', 'valuation', 'expectation risk', 'gap behavior']),
    );
    expect(EVENT_CONCEPT_MAP.earnings.conceptIds).toEqual(
      expect.arrayContaining(['revenue-growth', 'earnings', 'valuation', 'earnings-events']),
    );
    expect(EVENT_CONCEPT_MAP.interest_rate.displayConcepts).toEqual(
      expect.arrayContaining(['interest rates', 'macro uncertainty', 'volatility', 'event preparation']),
    );
    expect(EVENT_CONCEPT_MAP.interest_rate.conceptIds).toEqual(
      expect.arrayContaining(['interest-rates', 'central-bank', 'event-risk', 'uncertainty']),
    );
  });
});

describe('upcoming event selection', () => {
  it('prefers a near-term calendar event over a farther curated story', () => {
    const hub = composeMarketEventHub({
      calendarEvents: [cpi],
      calendarUnavailable: false,
      fetchedAt: NOW,
      now: NOW,
    });
    const selected = selectUpcomingStudyEvent(hub.cards, NOW);
    expect(selected?.origin).toBe('calendar');
    expect(selected?.kind).toBe('inflation');
    expect(selected?.title).toBe('CPI');
  });

  it('ignores events beyond the 10-day study horizon', () => {
    const hub = composeMarketEventHub({
      calendarEvents: [{ ...cpi, scheduledAt: NOW + 20 * 86400000 }],
      calendarUnavailable: false,
      fetchedAt: NOW,
      now: NOW,
    });
    const selected = selectUpcomingStudyEvent(hub.cards, NOW, 10);
    expect(selected?.origin).not.toBe('calendar');
  });
});

describe('beginner vs advanced behavior', () => {
  it('shows a learning calendar and no personalized trade-style stack for beginners', () => {
    const hub = composeMarketEventHub({
      calendarEvents: [cpi, fomc],
      calendarUnavailable: false,
      fetchedAt: NOW,
      now: NOW,
      experience: 'beginner',
    });
    expect(isEventPersonalizationEligible('beginner')).toBe(false);
    expect(hub.trainingPlan).toBeNull();
    expect(hub.learningCalendar.length).toBeGreaterThan(0);
    expect(hub.learningCalendar.length).toBeLessThanOrEqual(5);
    expect(hub.learningCalendar.every((card) => card.lifecycle !== 'developing')).toBe(true);
    expect(hub.learningCalendar.some((card) => LEARNING_CALENDAR_KINDS.includes(card.kind))).toBe(true);
    const fromCards = selectBeginnerLearningCalendar(hub.cards);
    expect(fromCards.some((card) => card.kind === 'inflation' || card.kind === 'interest_rate')).toBe(true);
  });

  it('recommends training (not a trade alert) for advanced users with a volatility gap', () => {
    const hub = composeMarketEventHub({
      calendarEvents: [cpi],
      calendarUnavailable: false,
      fetchedAt: NOW,
      now: NOW,
      experience: 'advanced',
      weakness: 'risk_management',
      gapConceptIds: ['event-volatility'],
    });
    const plan = hub.trainingPlan;
    expect(plan).not.toBeNull();
    expect(plan?.headline).toMatch(/CPI is approaching/i);
    expect(plan?.practiceGapNote).toMatch(/volatility management needs work/i);
    expect(plan?.lessonTitle).toMatch(/event risk/i);
    expect(plan?.lessonHref).toContain('fund-calendar');
    expect(plan?.replayHref).toContain('inflation');
    expect(plan?.simulateTitle).toMatch(/high-volatility/i);
    expect(plan?.simulateHref).toContain('prep=inflation');
    expect(plan?.simulateHref).toContain('difficulty=advanced');
    expect(plan?.reminder.toLowerCase()).toContain('not a trade alert');
    expect(`${plan?.headline} ${plan?.practiceGapNote} ${plan?.reminder}`).not.toMatch(PREDICTION);
  });

  it('routes weak event-risk to an event-risk lesson', () => {
    const hub = composeMarketEventHub({
      calendarEvents: [cpi],
      calendarUnavailable: false,
      fetchedAt: NOW,
      now: NOW,
      experience: 'advanced',
      mastery: [
        {
          conceptId: 'event-risk',
          state: 'needs_remediation',
          competenceState: 'needs_revisit',
          falseMastery: false,
        },
      ],
    });
    expect(hub.trainingPlan?.intent).toBe('event_risk_lesson');
    expect(hub.trainingPlan?.primary).toBe('lesson');
    expect(hub.trainingPlan?.lessonHref).toContain('fund-calendar');
    expect(hub.trainingPlan?.practiceGapNote).toMatch(/event-risk/i);
    expect(JSON.stringify(hub.trainingPlan)).not.toMatch(PREDICTION);
  });

  it('routes strong event-risk and weak uncertainty to an uncertainty exercise', () => {
    const resolved = resolveEventTrainingIntent({
      eventKind: 'interest_rate',
      mastery: [
        { conceptId: 'event-risk', state: 'demonstrated', competenceState: 'demonstrated', falseMastery: false },
        { conceptId: 'uncertainty', state: 'needs_remediation', competenceState: 'needs_revisit', falseMastery: false },
      ],
    });
    expect(resolved.intent).toBe('uncertainty_exercise');
    const hub = composeMarketEventHub({
      calendarEvents: [fomc],
      calendarUnavailable: false,
      fetchedAt: NOW,
      now: NOW,
      experience: 'advanced',
      mastery: [
        { conceptId: 'event-risk', state: 'demonstrated', competenceState: 'demonstrated', falseMastery: false },
        { conceptId: 'uncertainty', state: 'needs_remediation', competenceState: 'needs_revisit', falseMastery: false },
      ],
    });
    expect(hub.trainingPlan?.intent).toBe('uncertainty_exercise');
    expect(hub.trainingPlan?.primary).toBe('practice');
    expect(hub.trainingPlan?.practiceHref).toContain('rate-decision-uncertainty');
    expect(hub.trainingPlan?.practiceHref).toContain('concept=uncertainty');
    expect(hub.trainingPlan?.lessonHref).toContain('dec-uncertainty');
    expect(hub.trainingPlan?.lessonHref).toContain('concept=');
    expect(hub.trainingPlan?.replayHref).toContain('replay');
    expect(hub.trainingPlan?.simulateHref).toContain('/simulate');
    expect(`${hub.trainingPlan?.headline} ${hub.trainingPlan?.reminder}`).not.toMatch(PREDICTION);
  });

  it('routes strong fundamentals with weak application to an event-driven scenario', () => {
    const hub = composeMarketEventHub({
      calendarEvents: [
        {
          id: 'us-earnings',
          title: 'MegaCap earnings',
          country: 'United States',
          countryCode: 'US',
          category: 'other',
          impact: 'high',
          scheduledAt: NOW + 3 * 86400000,
          source: 'mock',
        },
      ],
      calendarUnavailable: false,
      fetchedAt: NOW,
      now: NOW,
      experience: 'professional',
      mastery: [
        { conceptId: 'earnings', state: 'demonstrated', competenceState: 'demonstrated', falseMastery: true },
      ],
    });
    expect(hub.trainingPlan?.intent).toBe('fundamentals_application');
    expect(hub.trainingPlan?.primary).toBe('simulate');
    expect(hub.trainingPlan?.simulateTitle).toMatch(/fundamentals scenario/i);
    expect(hub.trainingPlan?.simulateHref).toContain('prep=earnings');
    expect(hub.trainingPlan?.practiceHref).toContain('fundamentals');
    expect(hub.trainingPlan?.practiceHref).toContain('concept=');
    expect(hub.trainingPlan?.reminder.toLowerCase()).not.toMatch(/signal|buy|sell/);
  });
});

describe('no prediction language', () => {
  it('keeps education, stories, and plans free of directional tips', () => {
    const stories = listCuratedMarketStories(NOW);
    const blobs = [
      ...Object.values(EVENT_EDUCATION).flatMap((item) => [item.whyTradersCare, item.practicePrompt]),
      ...stories.flatMap((story) => [story.whatHappenedOrExpected, story.whyMarketsMayCare]),
    ];
    for (const text of blobs) {
      expect(text).not.toMatch(PREDICTION);
    }
    const plan = composeEventTrainingPlan({
      cards: composeMarketEventHub({
        calendarEvents: [fomc],
        calendarUnavailable: false,
        fetchedAt: NOW,
        now: NOW,
        experience: 'advanced',
      }).cards,
      experience: 'advanced',
      now: NOW,
      gapConceptIds: collectPracticeGapConceptIds({
        attempts: [{ drillId: 'rate-decision-uncertainty', correct: false }],
      }),
    });
    expect(`${plan?.headline} ${plan?.practiceGapNote ?? ''} ${plan?.reminder}`).not.toMatch(PREDICTION);
  });
});

describe('simulation event injection', () => {
  it('injects the mapped event kind and keeps the outcome stochastic', () => {
    const a = generateEventAwareSimulation({ userId: 'evt-a', kind: 'inflation', now: NOW_ISO, seed: 11 });
    const same = generateEventAwareSimulation({ userId: 'evt-a', kind: 'inflation', now: NOW_ISO, seed: 11 });
    expect(a.events.some((item) => item.kind === 'inflation')).toBe(true);
    expect(a.focus).toBe('event_adaptation');
    expect(a.events[0]?.briefing.toLowerCase()).not.toMatch(PREDICTION);
    expect(same.events[0]?.surpriseMagnitude).toBe(a.events[0]?.surpriseMagnitude);
    expect(same.events[0]?.shockBps).toBe(a.events[0]?.shockBps);
    const fingerprints = [11, 99, 201, 404].map((seed) => {
      const scenario = generateEventAwareSimulation({ userId: 'evt-a', kind: 'inflation', now: NOW_ISO, seed });
      const lead = scenario.events.find((item) => item.kind === 'inflation')!;
      return `${lead.actualValue}|${lead.surpriseMagnitude}|${lead.reactionStyle}|${lead.shockBps}`;
    });
    expect(new Set(fingerprints).size).toBeGreaterThan(1);
  });

  it('does not encode a fixed direction for rates or earnings', () => {
    const surprises = [3, 17, 41, 83, 211].map(
      (seed) =>
        generateEventAwareSimulation({ userId: 'evt-dir', kind: 'interest_rate', now: NOW_ISO, seed }).events.find(
          (item) => item.kind === 'rate_decision',
        )!.surpriseMagnitude,
    );
    expect(surprises.some((value) => value > 0)).toBe(true);
    expect(surprises.some((value) => value < 0) || surprises.some((value) => Math.abs(value) < 0.2)).toBe(true);
  });
});

describe('source attribution', () => {
  it('requires a named https source and a short paraphrase, not a copied article', () => {
    const articles = [
      ...Object.values(EVENT_EDUCATION).flatMap((item) => item.articles),
      ...listCuratedMarketStories(NOW).flatMap((story) => story.articles),
    ];
    expect(articles.length).toBeGreaterThan(0);
    const check = allArticlesAttributed(articles);
    expect(check.issues).toEqual([]);
    expect(check.ok).toBe(true);
    for (const article of articles) {
      expect(article.summary.length).toBeLessThanOrEqual(400);
      expect(article.url).toMatch(/^https:\/\//);
      expect(article.date.trim().length).toBeGreaterThan(0);
    }
  });

  it('rejects third-party text presented as TradeAcademy original reporting', () => {
    const check = checkSourceAttribution({
      headline: 'TradeAcademy original: CPI explainer',
      source: 'Someone',
      date: '2026-09-10',
      summary: 'Our exclusive report on the print.',
      whyItMatters: 'Context only.',
      url: 'https://example.com/cpi',
    });
    expect(check.ok).toBe(false);
    expect(check.issues.join(' ')).toMatch(/original reporting/i);
  });
});

describe('stale-data labeling', () => {
  it('marks a cached calendar snapshot as stale, not live', () => {
    const freshness = freshnessForSource({ source: 'finnhub', fromCache: true });
    expect(freshness.kind).toBe('cached');
    expect(isStaleCalendarSnapshot(freshness.kind)).toBe(true);
    expect(freshness.note.toLowerCase()).toMatch(/stale/);
    expect(freshness.note.toLowerCase()).toContain('not a live tape');

    const hub = composeMarketEventHub({
      calendarEvents: [cpi],
      calendarUnavailable: false,
      fetchedAt: NOW - 6 * 60 * 60 * 1000,
      fromCache: true,
      now: NOW,
    });
    const calendarCard = hub.cards.find((card) => card.origin === 'calendar');
    expect(calendarCard?.freshness.kind).toBe('cached');
    expect(calendarCard?.freshness.note.toLowerCase()).toMatch(/stale/);
    expect(hub.freshnessNote.toLowerCase()).toMatch(/stale/);
  });
});
