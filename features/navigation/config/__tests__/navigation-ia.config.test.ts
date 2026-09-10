import {
  IA_GLOSSARY,
  PRACTICE_HUB_SECTIONS,
  PRIMARY_TAB_LABELS,
  RESEARCH_HUB_SECTIONS,
  REVIEW_HUB_SECTIONS,
  YOU_HUB_SECTIONS,
} from '../navigation-ia.config';
import { COLD_DEEP_LINK_FALLBACKS, buildLegacyRouteRedirect } from '../review-navigation.config';

describe('navigation information architecture', () => {
  it('uses the product-loop primary tab glossary labels', () => {
    expect(PRIMARY_TAB_LABELS).toEqual([
      'Home',
      'Learn',
      'Practice',
      'Simulate',
      'Review',
      'Events',
      'You',
    ]);
    expect([
      IA_GLOSSARY.home,
      IA_GLOSSARY.learn,
      IA_GLOSSARY.practice,
      IA_GLOSSARY.simulate,
      IA_GLOSSARY.review,
      IA_GLOSSARY.events,
      IA_GLOSSARY.you,
    ]).toEqual([...PRIMARY_TAB_LABELS]);
  });

  it('keeps hub destinations unique within each hub', () => {
    for (const sections of [
      RESEARCH_HUB_SECTIONS,
      REVIEW_HUB_SECTIONS,
      YOU_HUB_SECTIONS,
      PRACTICE_HUB_SECTIONS,
    ]) {
      const hrefs = sections.flatMap((section) => section.items.map((item) => item.href));
      expect(new Set(hrefs).size).toBe(hrefs.length);
    }
  });

  it('keeps You as profile/progress/account and Lab under Practice', () => {
    const youHrefs = YOU_HUB_SECTIONS.flatMap((section) => section.items.map((item) => item.href));
    const practiceHrefs = PRACTICE_HUB_SECTIONS.flatMap((section) =>
      section.items.map((item) => item.href),
    );
    const reviewHrefs = REVIEW_HUB_SECTIONS.flatMap((section) =>
      section.items.map((item) => item.href),
    );

    expect(YOU_HUB_SECTIONS.map((section) => section.title)).toEqual([
      'Profile',
      'Progress',
      'Account',
    ]);
    expect(youHrefs).toContain('/settings/profile');
    expect(youHrefs).toContain('/settings');
    expect(youHrefs).toContain('/subscription');
    expect(youHrefs).toContain('/settings/privacy');
    expect(youHrefs).toContain('/settings/privacy?focus=export');
    expect(youHrefs).not.toContain('/decision/mentor');
    expect(practiceHrefs).toContain('/decision/lab');
    expect(practiceHrefs).toContain('/decision/simulator');
    expect(reviewHrefs).toContain('/journal');
    expect(reviewHrefs).toContain('/simulate');
    expect(reviewHrefs).toContain('/decision/replay-tv');
    expect(reviewHrefs).toContain('/decision/intelligence');
  });

  it('keeps Research educational and study names on search, not a quote board', () => {
    const researchHrefs = RESEARCH_HUB_SECTIONS.flatMap((section) =>
      section.items.map((item) => item.href),
    );
    expect(researchHrefs).toContain('/academy');
    expect(researchHrefs).not.toContain('/markets');
    expect(researchHrefs).toContain('/search');
    expect(researchHrefs).toContain('/events');
    expect(researchHrefs).toContain('/ai?source=research');
  });

  it('provides cold deep-link fallbacks for primary surfaces', () => {
    expect(COLD_DEEP_LINK_FALLBACKS).toEqual({
      research: '/research',
      review: '/review',
      portfolio: '/simulate',
      simulate: '/simulate',
      learn: '/learn',
      practice: '/practice',
      you: '/you',
      ask: '/ai',
      events: '/events',
      markets: '/search',
    });
    expect(buildLegacyRouteRedirect('/you')).toEqual({ pathname: '/you', params: {} });
    expect(buildLegacyRouteRedirect('/research')).toEqual({ pathname: '/research', params: {} });
  });
});
