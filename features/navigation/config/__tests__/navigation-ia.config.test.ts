import {
  IA_GLOSSARY,
  RESEARCH_HUB_SECTIONS,
  REVIEW_HUB_SECTIONS,
  YOU_HUB_SECTIONS,
} from '../navigation-ia.config';

describe('navigation information architecture', () => {
  it('uses the canonical decision-loop tab labels', () => {
    expect([
      IA_GLOSSARY.today,
      IA_GLOSSARY.research,
      IA_GLOSSARY.review,
      IA_GLOSSARY.ask,
      IA_GLOSSARY.you,
    ]).toEqual(['Today', 'Research', 'Review', 'Ask', 'You']);
  });

  it('keeps hub destinations unique within each hub', () => {
    for (const sections of [RESEARCH_HUB_SECTIONS, REVIEW_HUB_SECTIONS, YOU_HUB_SECTIONS]) {
      const hrefs = sections.flatMap((section) => section.items.map((item) => item.href));
      expect(new Set(hrefs).size).toBe(hrefs.length);
    }
  });

  it('surfaces the core research and review actions', () => {
    const researchHrefs = RESEARCH_HUB_SECTIONS.flatMap((section) =>
      section.items.map((item) => item.href),
    );
    const reviewHrefs = REVIEW_HUB_SECTIONS.flatMap((section) =>
      section.items.map((item) => item.href),
    );

    expect(researchHrefs).toContain('/decision/radar');
    expect(researchHrefs).toContain('/markets');
    expect(reviewHrefs).toContain('/journal');
    expect(reviewHrefs).toContain('/decision/decision-replay?segment=process');
  });
});
