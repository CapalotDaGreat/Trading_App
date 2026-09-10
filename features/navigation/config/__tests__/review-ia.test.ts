import { decisionOsUpsellCopy } from '@/features/decision/services/decision-os-access.service';

import { PRACTICE_HUB_SECTIONS, REVIEW_HUB_SECTIONS } from '../navigation-ia.config';
import {
  buildLegacyAnalysisRedirect,
  buildLegacyReplayRedirect,
  normalizeReplayInterval,
  normalizeReviewSegment,
  REVIEW_SEGMENTS,
} from '../review-navigation.config';

describe('review information architecture', () => {
  it('keeps Review work, patterns, and replay rooms', () => {
    expect(REVIEW_HUB_SECTIONS.map((section) => section.title)).toEqual([
      'Your work',
      'Patterns',
      'Replay',
    ]);
    const work = REVIEW_HUB_SECTIONS.find((section) => section.title === 'Your work');
    expect(work?.items.map((item) => item.href)).toEqual(
      expect.arrayContaining(['/journal', '/simulate', '/decision/decision-replay?segment=process']),
    );
  });

  it('keeps Lab, Simulator, Chart Replay, and Decision Replay in Practice', () => {
    const scenarios = PRACTICE_HUB_SECTIONS.find((section) => section.title === 'Scenarios');
    expect(scenarios?.items.map((item) => item.href)).toEqual([
      '/decision/lab',
      '/decision/simulator',
      '/decision/decision-replay?segment=chart',
      '/decision/replay-tv',
    ]);
  });

  it('defines clear Process Tape and Chart Replay segments', () => {
    expect(REVIEW_SEGMENTS.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: 'process', label: 'Process Tape' },
      { id: 'chart', label: 'Chart Replay' },
    ]);
    expect(normalizeReviewSegment(undefined)).toBe('process');
    expect(normalizeReviewSegment('unknown')).toBe('process');
    expect(normalizeReviewSegment(['chart'])).toBe('chart');
    expect(normalizeReplayInterval('4h')).toBe('4h');
    expect(normalizeReplayInterval('invalid')).toBe('1d');
  });

  it('redirects old Chart Replay deep links to the Review chart segment', () => {
    expect(buildLegacyReplayRedirect({ symbol: 'AAPL', interval: '1d' })).toEqual({
      pathname: '/decision/decision-replay',
      params: { symbol: 'AAPL', interval: '1d', segment: 'chart' },
    });
  });

  it('redirects legacy analysis links to the canonical asset study tab', () => {
    expect(
      buildLegacyAnalysisRedirect('BRK.B', {
        symbol: 'BRK.B',
        tab: 'ai',
        marketType: 'stock',
        source: 'alert',
      }),
    ).toEqual({
      pathname: '/asset/[symbol]',
      params: {
        symbol: 'BRK.B',
        tab: 'learn',
        legacyTab: 'ai',
        marketType: 'stock',
        source: 'alert',
      },
    });
  });

  it('keeps Review premium copy grounded in recorded process', () => {
    const copy = [
      decisionOsUpsellCopy('weeklyReviews'),
      decisionOsUpsellCopy('advancedReplay'),
      decisionOsUpsellCopy('convictionDrift'),
    ].join(' ');

    expect(copy).not.toMatch(/Replay AI|cloud|priority/i);
    expect(copy).toMatch(/recorded decisions|Process Tape/);
  });
});
