import { EVENT_EDUCATION } from '../../content/event-education';
import { listCuratedMarketStories } from '../../content/event-stories';
import { composeMarketEventHub } from '../event-hub.service';
import { educationForCategory, eventTrainingCopy, kindFromTitle } from '../event-education.service';
import { scoreEventImportance } from '../event-importance.service';
import { composeEventTrainingPlan, isEventPersonalizationEligible } from '../event-personalization.service';
import { lifecycleForEvent } from '../event-status.service';

const FORBIDDEN = /buy this|sell this|short this|should buy|should sell|guaranteed|buy now|sell now/i;

function collectCopy(): string[] {
  const stories = listCuratedMarketStories(Date.parse('2026-09-10T00:00:00.000Z'));
  const education = Object.values(EVENT_EDUCATION).flatMap((item) => [
    item.whyTradersCare,
    item.practicePrompt,
    item.practiceTitle,
    item.simulateTitle,
    ...item.articles.flatMap((article) => [article.summary, article.whyItMatters, article.headline]),
  ]);
  const storyCopy = stories.flatMap((story) => [
    story.whatHappenedOrExpected,
    story.whyMarketsMayCare,
    ...story.articles.flatMap((article) => [article.summary, article.whyItMatters]),
  ]);
  return [...education, ...storyCopy];
}

describe('event education', () => {
  it('maps FOMC-style categories to a lesson and forbids trade language', () => {
    const education = educationForCategory('interest_rate');
    expect(education.relatedLessonId).toBe('fund-economy');
    expect(education.concepts).toEqual(
      expect.arrayContaining(['interest rates', 'monetary policy', 'market expectations', 'volatility', 'risk management']),
    );
    expect(education.article?.url).toContain('federalreserve.gov');
    expect(education.replayId).toBe('fomc-decision-lab');
    const copy = eventTrainingCopy({
      id: '1',
      title: 'FOMC rate decision',
      country: 'United States',
      countryCode: 'US',
      category: 'interest_rate',
      impact: 'high',
      scheduledAt: Date.parse('2026-09-16T18:00:00.000Z'),
      source: 'mock',
    });
    expect(copy.toLowerCase()).toContain('preparation');
    expect(copy.toLowerCase()).not.toMatch(FORBIDDEN);
  });

  it('classifies earnings and geo titles without changing the calendar vendor', () => {
    expect(kindFromTitle('MegaCap earnings')).toBe('earnings');
    expect(kindFromTitle('Geopolitical briefing')).toBe('geopolitical');
  });
});

describe('event lifecycle and importance', () => {
  const now = Date.parse('2026-09-10T12:00:00.000Z');

  it('labels upcoming, released, developing, and historical', () => {
    expect(lifecycleForEvent({ scheduledAt: now + 3 * 86400000, now })).toBe('upcoming');
    expect(lifecycleForEvent({ scheduledAt: now - 3 * 3600000, actual: '0.3%', now })).toBe('released');
    expect(lifecycleForEvent({ scheduledAt: now + 30 * 60000, now })).toBe('developing');
    expect(lifecycleForEvent({ scheduledAt: now - 20 * 86400000, now })).toBe('historical');
  });

  it('scores from transparent criteria, not media popularity', () => {
    const scored = scoreEventImportance({
      kind: 'interest_rate',
      title: 'FOMC rate decision',
      impact: 'high',
      lifecycle: 'upcoming',
      countryCode: 'US',
      preferredTopics: ['fundamentals'],
      weakness: 'risk_management',
    });
    expect(scored.score).toBeGreaterThan(50);
    expect(scored.reasons.join(' ')).toMatch(/historical|scope|volatility|learning|area to improve/i);
    expect(scored.reasons.join(' ').toLowerCase()).not.toContain('trending');
    expect(scored.reasons.join(' ').toLowerCase()).toContain('not a popularity rank');
  });
});

describe('event hub and personalization', () => {
  const now = Date.parse('2026-09-10T12:00:00.000Z');
  const fomc = {
    id: 'us-fomc',
    title: 'FOMC rate decision',
    country: 'United States',
    countryCode: 'US',
    category: 'interest_rate' as const,
    impact: 'high' as const,
    forecast: 'Hold',
    scheduledAt: now + 3 * 86400000,
    source: 'mock',
  };

  it('keeps educational stories when the calendar source fails', () => {
    const hub = composeMarketEventHub({
      calendarEvents: [],
      calendarUnavailable: true,
      fetchedAt: now,
      now,
    });
    expect(hub.calendarUnavailable).toBe(true);
    expect(hub.freshnessNote).toContain('temporarily unavailable');
    expect(hub.cards.some((card) => card.origin === 'curated')).toBe(true);
    expect(hub.cards.some((card) => card.lifecycle === 'historical')).toBe(true);
    expect(hub.cards.some((card) => card.lifecycle === 'developing')).toBe(true);
  });

  it('recommends a study stack only for advanced users', () => {
    const hub = composeMarketEventHub({
      calendarEvents: [fomc],
      calendarUnavailable: false,
      fetchedAt: now,
      now,
      experience: 'advanced',
    });
    expect(isEventPersonalizationEligible('beginner')).toBe(false);
    expect(isEventPersonalizationEligible('advanced')).toBe(true);
    expect(composeEventTrainingPlan({ cards: hub.cards, experience: 'beginner', now })).toBeNull();
    const plan = hub.trainingPlan;
    expect(plan?.eventTitle).toContain('FOMC');
    expect(plan?.lessonHref).toContain('/academy/lesson/');
    expect(plan?.practiceHref).toContain('/practice');
    expect(plan?.replayHref).toContain('fomc-decision-lab');
    expect(plan?.simulateHref).toContain('prep=rates');
    expect(plan?.reminder.toLowerCase()).not.toMatch(FORBIDDEN);
  });

  it('never turns event copy into a signal', () => {
    for (const text of collectCopy()) {
      expect(text).not.toMatch(FORBIDDEN);
    }
  });
});
