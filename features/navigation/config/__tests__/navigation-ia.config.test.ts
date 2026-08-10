import {
  IA_GLOSSARY,
  RESEARCH_HUB_SECTIONS,
  REVIEW_HUB_SECTIONS,
  YOU_HUB_SECTIONS,
} from '../navigation-ia.config';
import { COLD_DEEP_LINK_FALLBACKS, buildLegacyRouteRedirect } from '../review-navigation.config';

describe('navigation information architecture', () => {
  it('uses the calm five-tab glossary labels', () => {
    expect([
      IA_GLOSSARY.today,
      IA_GLOSSARY.research,
      IA_GLOSSARY.portfolio,
      IA_GLOSSARY.review,
      IA_GLOSSARY.you,
    ]).toEqual(['Today', 'Research', 'Portfolio', 'Review', 'You']);
    expect(IA_GLOSSARY.ask).toBe('Ask');
  });

  it('keeps hub destinations unique within each hub', () => {
    for (const sections of [RESEARCH_HUB_SECTIONS, REVIEW_HUB_SECTIONS, YOU_HUB_SECTIONS]) {
      const hrefs = sections.flatMap((section) => section.items.map((item) => item.href));
      expect(new Set(hrefs).size).toBe(hrefs.length);
    }
  });

  it('surfaces Mentor under You/Growth and Simulator under Review/Practice', () => {
    const youHrefs = YOU_HUB_SECTIONS.flatMap((section) => section.items.map((item) => item.href));
    const reviewPractice = REVIEW_HUB_SECTIONS.find((section) => section.title === 'Practice');
    const reviewHrefs = REVIEW_HUB_SECTIONS.flatMap((section) =>
      section.items.map((item) => item.href),
    );

    expect(YOU_HUB_SECTIONS[0]?.title).toBe('Growth');
    expect(youHrefs[0]).toBe('/decision/mentor');
    expect(reviewPractice?.items.some((item) => item.href === '/decision/simulator')).toBe(true);
    expect(reviewHrefs).toContain('/decision/replay-tv');
    expect(reviewHrefs).toContain('/journal');
  });

  it('keeps Research Ask contextual and Markets secondary', () => {
    const researchHrefs = RESEARCH_HUB_SECTIONS.flatMap((section) =>
      section.items.map((item) => item.href),
    );
    expect(researchHrefs).toContain('/decision/radar');
    expect(researchHrefs).toContain('/markets');
    expect(researchHrefs).toContain('/ai?source=research');
  });

  it('provides cold deep-link fallbacks for primary tabs', () => {
    expect(COLD_DEEP_LINK_FALLBACKS).toEqual({
      research: '/research',
      review: '/review',
      portfolio: '/portfolio',
      you: '/you',
      ask: '/ai',
    });
    expect(buildLegacyRouteRedirect('/you')).toEqual({ pathname: '/you', params: {} });
    expect(buildLegacyRouteRedirect('/research')).toEqual({ pathname: '/research', params: {} });
  });
});
