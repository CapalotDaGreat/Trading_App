import { decisionOsUpsellCopy } from '@/features/decision/services/decision-os-access.service';

import { MORE_HUB_SECTIONS } from '../more-hub.config';
import {
  buildLegacyAnalysisRedirect,
  buildLegacyReplayRedirect,
  normalizeReplayInterval,
  normalizeReviewSegment,
  REVIEW_SEGMENTS,
} from '../review-navigation.config';

describe('review information architecture', () => {
  it('exposes the four More sections with Review and Decision Heatmap', () => {
    expect(MORE_HUB_SECTIONS.map((section) => section.title)).toEqual([
      'Decide',
      'Review',
      'Practice',
      'Stay on Top',
    ]);

    const review = MORE_HUB_SECTIONS.find((section) => section.title === 'Review');
    expect(review?.items).toEqual([
      expect.objectContaining({
        href: '/decision/decision-replay',
        title: 'Review',
      }),
      expect.objectContaining({
        href: '/decision/heatmap',
        title: 'Decision Heatmap',
      }),
    ]);
  });

  it('keeps Mentor, Simulator, Personal Intelligence, Passport, Lab and Learn in Practice', () => {
    const practice = MORE_HUB_SECTIONS.find((section) => section.title === 'Practice');
    expect(practice?.items.map((item) => item.href)).toEqual([
      '/decision/mentor',
      '/decision/simulator',
      '/decision/intelligence',
      '/decision/passport',
      '/decision/lab',
      '/analysis/backtest',
      '/academy',
    ]);
    expect(practice?.items.find((item) => item.href === '/analysis/backtest')?.title).toBe(
      'Strategy sandbox — sample data',
    );
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

  it('redirects legacy analysis links to the canonical asset Analysis tab', () => {
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
        tab: 'analysis',
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
