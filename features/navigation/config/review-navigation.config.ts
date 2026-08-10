export type ReviewSegment = 'process' | 'chart';

export const REVIEW_SEGMENTS: readonly {
  id: ReviewSegment;
  label: string;
  accessibilityLabel: string;
  testID: string;
}[] = [
  {
    id: 'process',
    label: 'Process Tape',
    accessibilityLabel: 'Show Process Tape review',
    testID: 'review-segment-process',
  },
  {
    id: 'chart',
    label: 'Chart Replay',
    accessibilityLabel: 'Show Chart Replay practice',
    testID: 'review-segment-chart',
  },
];

export function normalizeReviewSegment(value?: string | string[]): ReviewSegment {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === 'chart' ? 'chart' : 'process';
}

const REPLAY_INTERVALS = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'] as const;
export type ReplayInterval = (typeof REPLAY_INTERVALS)[number];

export function normalizeReplayInterval(value?: string | string[]): ReplayInterval {
  const candidate = Array.isArray(value) ? value[0] : value;
  return REPLAY_INTERVALS.find((interval) => interval === candidate) ?? '1d';
}

type RouteParams = Record<string, string | string[] | undefined>;

export function buildLegacyRouteRedirect(
  pathname:
    | '/you'
    | '/research'
    | '/review'
    | '/portfolio'
    | '/decision/mentor'
    | '/decision/intelligence',
  params: RouteParams = {},
) {
  return {
    pathname,
    params,
  };
}

/** Cold-start fallbacks when a nested deep link cannot be resolved. */
export const COLD_DEEP_LINK_FALLBACKS = {
  research: '/research',
  review: '/review',
  portfolio: '/portfolio',
  you: '/you',
  ask: '/ai',
} as const;

export function buildLegacyReplayRedirect(params: RouteParams = {}) {
  return {
    pathname: '/decision/decision-replay' as const,
    params: { ...params, segment: 'chart' as const },
  };
}

export function buildLegacyAnalysisRedirect(symbol: string, params: RouteParams = {}) {
  const { symbol: _legacySymbol, tab: legacyTab, ...rest } = params;
  return {
    pathname: '/asset/[symbol]' as const,
    params: {
      ...rest,
      symbol,
      tab: 'advanced' as const,
      ...(legacyTab ? { legacyTab } : {}),
    },
  };
}
