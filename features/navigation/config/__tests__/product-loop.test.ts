import { BRAND } from '@/shared/constants/brand';

import { PRODUCT_LOOP_STEPS } from '../navigation-ia.config';
import { resolveLoopCtas } from '../product-loop';

describe('product loop CTAs', () => {
  it('names Replay and Journal in the brand loop', () => {
    expect(BRAND.loop).toBe(
      'Learn → Practice → Replay → Simulate → Journal → Review → Improve',
    );
  });

  it('keeps the six sequential surfaces before Improve', () => {
    expect(PRODUCT_LOOP_STEPS.map((step) => step.id)).toEqual([
      'learn',
      'practice',
      'replay',
      'simulate',
      'journal',
      'review',
    ]);
  });

  it('offers Practice after Learn', () => {
    const next = resolveLoopCtas({ current: 'learn' });
    expect(next[0]).toEqual({ id: 'practice', href: '/practice', label: 'Practice' });
    expect(next.map((step) => step.id)).toEqual(['practice', 'replay', 'simulate']);
  });

  it('does not force a duplicate Replay after Practice', () => {
    const next = resolveLoopCtas({ current: 'practice' });
    expect(next.map((step) => step.href)).toEqual([
      '/decision/replay-tv',
      '/simulate',
      '/journal',
    ]);
  });

  it('prefers planner remediation after Practice instead of always Replay', () => {
    const next = resolveLoopCtas({
      current: 'practice',
      followUp: { label: 'Retry sizing', href: '/practice?drill=risk-size-1' },
    });
    expect(next.map((step) => step.href)).toEqual([
      '/practice?drill=risk-size-1',
      '/decision/replay-tv',
      '/simulate',
    ]);
  });

  it('offers Journal after Simulate', () => {
    const next = resolveLoopCtas({ current: 'simulate' });
    expect(next[0]).toEqual({ id: 'journal', href: '/journal', label: 'Journal' });
    expect(next.map((step) => step.id)).toContain('review');
  });

  it('offers Review after Journal', () => {
    const next = resolveLoopCtas({ current: 'journal' });
    expect(next).toEqual([{ id: 'review', href: '/review', label: 'Review' }]);
  });

  it('sends Review to the Training Planner next action', () => {
    const next = resolveLoopCtas({
      current: 'review',
      plannerNext: { label: 'Start next training', href: '/practice?drill=invalidation-1' },
    });
    expect(next).toEqual([
      { id: 'improve', href: '/practice?drill=invalidation-1', label: 'Start next training' },
    ]);
  });

  it('falls back to Home when Review has no planner item', () => {
    expect(resolveLoopCtas({ current: 'review' })).toEqual([
      { id: 'improve', href: '/', label: 'Train next' },
    ]);
  });

  it('puts the planner next action first after Learn', () => {
    const next = resolveLoopCtas({
      current: 'learn',
      plannerNext: { label: 'Retry sizing', href: '/practice?drill=position-size' },
    });
    expect(next[0]).toEqual({
      id: 'improve',
      href: '/practice?drill=position-size',
      label: 'Retry sizing',
    });
    expect(next.map((step) => step.href)).toContain('/practice');
  });

  it('puts the planner next action first after Simulate', () => {
    const next = resolveLoopCtas({
      current: 'simulate',
      plannerNext: { label: 'Journal this close', href: '/journal?from=simulate' },
    });
    expect(next[0]?.href).toBe('/journal?from=simulate');
  });
});
