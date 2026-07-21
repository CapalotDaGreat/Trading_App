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
  it('exposes the four More sections with one Review entry', () => {
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
    ]);
  });

  it('keeps Lab and Learn in Practice and labels the sample strategy sandbox honestly', () => {
    const practice = MORE_HUB_SECTIONS.find((section) => section.title === 'Practice');
    expect(practice?.items.map((item) => item.href)).toEqual([
      '/decision/lab',
      '/analysis/backtest',
      '/academy',
    ]);
    expect(practice?.items[1]?.title).toBe('Strategy sandbox — sample data');
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
