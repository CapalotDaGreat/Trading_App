import {
  FORBIDDEN_PRIMARY_CTA_HREFS,
  HIDDEN_TAB_ROUTES,
  PRACTICE_HUB_SECTIONS,
  PRIMARY_TAB_HREFS,
  PRIMARY_TAB_LABELS,
  PRODUCT_LOOP_STEPS,
  RESEARCH_HUB_SECTIONS,
  REVIEW_HUB_SECTIONS,
  SIMULATE_TAB_ICON,
  YOU_HUB_SECTIONS,
} from '../navigation-ia.config';
import { COLD_DEEP_LINK_FALLBACKS } from '../review-navigation.config';

function pathOf(href: string): string {
  return href.split('?')[0] ?? href;
}

function hubHrefs(): string[] {
  return [
    ...RESEARCH_HUB_SECTIONS,
    ...PRACTICE_HUB_SECTIONS,
    ...REVIEW_HUB_SECTIONS,
    ...YOU_HUB_SECTIONS,
  ].flatMap((section) => section.items.map((item) => item.href));
}

describe('release UX navigation smoke', () => {
  it('keeps the seven educational tabs and does not add Ask, Markets, or Portfolio', () => {
    expect(PRIMARY_TAB_LABELS).toEqual([
      'Home',
      'Learn',
      'Practice',
      'Simulate',
      'Review',
      'Events',
      'You',
    ]);
    expect(PRIMARY_TAB_LABELS).not.toContain('Ask');
    expect(PRIMARY_TAB_LABELS).not.toContain('Markets');
    expect(PRIMARY_TAB_LABELS).not.toContain('Portfolio');
    expect(PRIMARY_TAB_HREFS).toHaveLength(PRIMARY_TAB_LABELS.length);
  });

  it('hides terminal leftover tabs instead of promoting them', () => {
    for (const href of HIDDEN_TAB_ROUTES) {
      expect(PRIMARY_TAB_HREFS).not.toContain(href);
    }
    expect(HIDDEN_TAB_ROUTES).toEqual(
      expect.arrayContaining(['/ai', '/research', '/portfolio', '/markets', '/more']),
    );
  });

  it('does not use briefcase/portfolio symbolism for Simulate', () => {
    expect(SIMULATE_TAB_ICON).toBe('play-circle-outline');
    expect(SIMULATE_TAB_ICON).not.toMatch(/briefcase/i);
    const reviewSim = REVIEW_HUB_SECTIONS.flatMap((section) => section.items).find(
      (item) => item.testID === 'review-simulation',
    );
    expect(reviewSim?.icon).toBe('play-circle-outline');
    expect(reviewSim?.description).not.toMatch(/ledger|broker/i);
  });

  it('keeps the competence loop free of quote-board and broker routes', () => {
    const loopHrefs = PRODUCT_LOOP_STEPS.map((step) => step.href);
    expect(loopHrefs).toEqual([
      '/learn',
      '/practice',
      '/decision/replay-tv',
      '/simulate',
      '/journal',
      '/review',
    ]);
    for (const href of loopHrefs) {
      expect(FORBIDDEN_PRIMARY_CTA_HREFS).not.toContain(pathOf(href));
    }
  });

  it('does not expose old terminal routes as hub primary CTAs', () => {
    const hrefs = hubHrefs();
    const copy = [
      ...RESEARCH_HUB_SECTIONS,
      ...PRACTICE_HUB_SECTIONS,
      ...REVIEW_HUB_SECTIONS,
      ...YOU_HUB_SECTIONS,
    ]
      .flatMap((section) => section.items)
      .map((item) => `${item.title} ${item.description}`)
      .join(' ');

    for (const href of hrefs) {
      expect(FORBIDDEN_PRIMARY_CTA_HREFS).not.toContain(pathOf(href));
    }
    expect(hrefs).not.toContain('/markets');
    expect(hrefs).not.toContain('/portfolio');
    expect(hrefs).not.toContain('/alerts');
    expect(copy).not.toMatch(/\bbuy now\b|\bsell now\b|\bsignal queue\b|\btrading board\b/i);
  });

  it('sends legacy Markets deep links to educational search', () => {
    expect(COLD_DEEP_LINK_FALLBACKS.markets).toBe('/search');
    expect(COLD_DEEP_LINK_FALLBACKS.portfolio).toBe('/simulate');
    expect(COLD_DEEP_LINK_FALLBACKS.ask).toBe('/ai');
  });
});
