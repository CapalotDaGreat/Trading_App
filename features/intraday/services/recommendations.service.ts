import type { IntradayDrillKind } from './intraday-drills.service';

/**
 * Rule-based adaptive recommendations for intraday training.
 * Every target is a real route in the app — no dead links, no invented progress.
 */

export interface IntradayRecommendation {
  id: string;
  reason: string;
  label: string;
  href: string;
}

export interface IntradayPerformanceSignals {
  missedDrillKinds: IntradayDrillKind[];
  /** Sessions where an order was rejected by the daily-loss breaker. */
  breakerSessions: number;
  /** Sessions finished flat by plan. */
  flatSessions: number;
  /** Sessions with cost totals exceeding gross gains. */
  costHeavySessions: number;
  completedSessions: number;
}

export function recommendIntradayNext(
  signals: IntradayPerformanceSignals,
): IntradayRecommendation[] {
  const out: IntradayRecommendation[] = [];
  const missed = new Set(signals.missedDrillKinds);

  if (missed.has('breakout-confirmation') || missed.has('failed-breakout')) {
    out.push({
      id: 'rec-breakout',
      reason: 'Breakout decisions keep missing. Re-train acceptance before size.',
      label: 'Drills: breakout confirmation',
      href: '/intraday/drills',
    });
    out.push({
      id: 'rec-failed-breakout-replay',
      reason: 'See a breakout fail with the future hidden, then commit early.',
      label: 'Replay: false breakout room',
      href: '/decision/replay-tv',
    });
  }
  if (missed.has('sizing') || missed.has('risk-reward')) {
    out.push({
      id: 'rec-sizing',
      reason: 'Sizing arithmetic needs reps before the next session.',
      label: 'Drills: position sizing',
      href: '/intraday/drills',
    });
    out.push({
      id: 'rec-risk-lesson',
      reason: 'Revisit risk-per-trade in the Day Trading path.',
      label: 'Lesson: intraday risk budgets',
      href: '/academy/lesson/dt-intraday-risk',
    });
  }
  if (signals.breakerSessions > 0) {
    out.push({
      id: 'rec-breaker',
      reason: 'A daily loss limit was reached recently. Practise stopping on purpose.',
      label: 'Trading Day with a tight daily limit',
      href: '/intraday/day',
    });
  }
  if (signals.costHeavySessions > 0 || missed.has('cost-drag')) {
    out.push({
      id: 'rec-costs',
      reason: 'Costs are eating simulated gross moves. Make friction visible.',
      label: 'Scalping practice (spread-aware)',
      href: '/intraday/scalp',
    });
  }
  if (missed.has('multi-timeframe')) {
    out.push({
      id: 'rec-mtf',
      reason: 'Conflicting timeframes need a top-down routine.',
      label: 'Lesson: multi-timeframe process',
      href: '/academy/lesson/dt-multi-timeframe',
    });
  }
  if (missed.has('vwap-context')) {
    out.push({
      id: 'rec-vwap',
      reason: 'VWAP is being read as a signal. Rebuild it as context.',
      label: 'Lesson: volume and VWAP',
      href: '/academy/lesson/dt-vwap-volume',
    });
  }
  if (signals.completedSessions === 0) {
    out.push({
      id: 'rec-first-session',
      reason: 'Start with one complete simulated day — finishing flat counts.',
      label: 'Start a Trading Day',
      href: '/intraday/day',
    });
  }
  if (signals.flatSessions > 0 && out.length === 0) {
    out.push({
      id: 'rec-after-flat',
      reason: 'Flat sessions are working. Add order mechanics next.',
      label: 'Lesson: orders and execution',
      href: '/academy/lesson/dt-execution-orders',
    });
  }
  return out.slice(0, 4);
}
