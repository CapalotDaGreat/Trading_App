import type {
  DailyRiskConfig,
  ExecutionAccount,
  ExecutionConfig,
  IntradayInterval,
  IntradayOrder,
  IntradayScenario,
  ReplayState,
} from '../types/intraday.types';

import { aggregateCandles } from './candle.service';
import {
  DEFAULT_EXECUTION_CONFIG,
  createExecutionAccount,
  executeOrderOnCandle,
} from './execution.service';
import { createReplay } from './replay-engine.service';
import { evaluateRiskGate, isRiskIncreasing } from './risk-controls.service';
import { generateSyntheticSession } from './synthetic-session.service';

/**
 * A complete simulated trading day: pre-session plan → opening volatility →
 * development → mid/late session → end-of-session review.
 *
 * A session is successful when the plan is followed — including finishing
 * completely flat. Placing a trade is never required.
 */

export interface TradingDaySession {
  id: string;
  scenario: IntradayScenario;
  interval: IntradayInterval;
  replay: ReplayState;
  account: ExecutionAccount;
  orders: IntradayOrder[];
  execution: ExecutionConfig;
  risk: DailyRiskConfig;
  /** Written before the first order. Empty string = not yet written. */
  preSessionPlan: string;
  maxDailyLossNote: string;
  decisions: SessionDecision[];
  breakerEvents: string[];
  status: 'preparing' | 'active' | 'review';
  startedAt: string;
}

export interface SessionDecision {
  candleIndex: number;
  action: 'wait' | 'enter' | 'reduce' | 'exit' | 'observe';
  thesis?: string;
  invalidation?: string;
  note?: string;
  at: string;
}

export function createTradingDaySession(input: {
  seed: number;
  interval?: IntradayInterval;
  scalp?: boolean;
  risk?: Partial<DailyRiskConfig>;
  execution?: Partial<ExecutionConfig>;
  startingCash?: number;
}): TradingDaySession {
  const scenario = generateSyntheticSession({
    seed: input.seed,
    minutes: input.scalp ? 60 : 150,
  });
  const interval = input.interval ?? (input.scalp ? '1m' : '5m');
  const series = aggregateCandles(scenario.candles, interval);
  const equity = input.startingCash ?? 100_000;
  return {
    id: scenario.id,
    scenario,
    interval,
    replay: createReplay(series.length),
    account: createExecutionAccount(equity),
    orders: [],
    execution: {
      ...DEFAULT_EXECUTION_CONFIG,
      ...(input.scalp ? { spreadBps: 6, slippageBps: 3 } : {}),
      ...input.execution,
    },
    risk: {
      equity,
      maxRiskPercentPerTrade: 0.005,
      maxDailyLoss: equity * 0.02,
      maxConsecutiveLosses: 3,
      ...input.risk,
    },
    preSessionPlan: '',
    maxDailyLossNote: 'Simulated limit only — it does not protect a real account.',
    decisions: [],
    breakerEvents: [],
    status: 'preparing',
    startedAt: new Date().toISOString(),
  };
}

export function tradedSeries(session: TradingDaySession) {
  return aggregateCandles(session.scenario.candles, session.interval);
}

/** Advance one candle, executing pending orders against it. Returns a new session. */
export function advanceSession(session: TradingDaySession): TradingDaySession {
  const series = tradedSeries(session);
  const nextCursor = Math.min(series.length - 1, session.replay.cursor + 1);
  if (nextCursor === session.replay.cursor) return session;
  const candle = series[nextCursor]!;
  let account = session.account;
  const orders = session.orders.map((order) => {
    if (order.status !== 'pending' && order.status !== 'partially_filled') return order;
    const result = executeOrderOnCandle({
      account,
      order,
      candle,
      candleIndex: nextCursor,
      config: session.execution,
    });
    account = result.account;
    return result.order;
  });
  const gate = evaluateRiskGate({ account, config: session.risk, markPrice: candle.close });
  const breakerEvents =
    gate.circuitBreakerActive && session.breakerEvents.length === 0
      ? [
          `Candle ${nextCursor + 1}: daily loss circuit breaker activated. New risk blocked; risk reduction still allowed.`,
        ]
      : session.breakerEvents;
  return {
    ...session,
    replay: {
      ...session.replay,
      cursor: nextCursor,
      playing: nextCursor < series.length - 1 ? session.replay.playing : false,
    },
    account,
    orders,
    breakerEvents,
    status: session.status === 'preparing' ? 'active' : session.status,
  };
}

export interface SubmitOrderResult {
  session: TradingDaySession;
  accepted: boolean;
  reason?: string;
}

/** Submit an order. Risk-increasing orders are refused when the gate is closed. */
export function submitSessionOrder(
  session: TradingDaySession,
  order: IntradayOrder,
): SubmitOrderResult {
  const series = tradedSeries(session);
  const mark = series[session.replay.cursor]?.close;
  const gate = evaluateRiskGate({
    account: session.account,
    config: session.risk,
    markPrice: mark,
  });
  const increasing = isRiskIncreasing(
    session.account,
    order.side,
    order.quantity - order.filledQuantity,
  );
  if (increasing && !gate.canOpenRisk) {
    return {
      session: {
        ...session,
        orders: [
          ...session.orders,
          { ...order, status: 'rejected', rejectReason: gate.reasons[0] },
        ],
      },
      accepted: false,
      reason: gate.reasons[0] ?? 'Risk gate closed.',
    };
  }
  if (increasing && !session.preSessionPlan.trim()) {
    return {
      session,
      accepted: false,
      reason:
        'Write the pre-session plan first: thesis, invalidation, and maximum daily loss. Observation needs no plan.',
    };
  }
  return { session: { ...session, orders: [...session.orders, order] }, accepted: true };
}

export function recordDecision(
  session: TradingDaySession,
  decision: SessionDecision,
): TradingDaySession {
  return { ...session, decisions: [...session.decisions, decision] };
}

export interface SessionReview {
  processScore: number; // 0–100, process only — never simulated P/L
  flat: boolean;
  planWritten: boolean;
  decisionsRecorded: number;
  breakerRespected: boolean;
  headline: string;
  findings: string[];
}

/**
 * Grade the session by process. A profitable plan violation scores worse than
 * a losing plan-following session, and a deliberate flat session can score top marks.
 */
export function reviewSession(session: TradingDaySession, reflection: string): SessionReview {
  const flat = session.account.tradesPlaced === 0;
  const planWritten = session.preSessionPlan.trim().length >= 10;
  const findings: string[] = [];
  let score = 0;

  if (planWritten) score += 30;
  else
    findings.push(
      'No written pre-session plan. The plan is written before the open, not reconstructed after.',
    );

  if (flat) {
    score += 40;
    findings.push(
      'Finished flat by choice. Observation without a trade is complete practice when the plan says so.',
    );
  } else {
    const withThesis = session.decisions.filter(
      (d) => d.action === 'enter' && d.thesis && d.invalidation,
    ).length;
    const entries = session.decisions.filter((d) => d.action === 'enter').length;
    if (entries > 0 && withThesis === entries) score += 40;
    else if (entries > 0) {
      score += 15;
      findings.push('At least one entry lacked a written thesis or invalidation at decision time.');
    } else {
      score += 25;
      findings.push(
        'Orders were placed without recorded entry decisions — journal the reasoning next time.',
      );
    }
  }

  const breakerRespected = !(
    session.breakerEvents.length > 0 &&
    session.orders.some((o) => o.status === 'rejected' && o.rejectReason)
  );
  if (session.breakerEvents.length === 0 || breakerRespected) score += 15;
  if (session.breakerEvents.length > 0) {
    findings.push('The daily loss circuit breaker activated. Stopping is the skill being trained.');
  }

  if (reflection.trim().length >= 20) score += 15;
  else
    findings.push(
      'Add a short post-session reflection (20+ characters): what did the tape teach, what repeats?',
    );

  return {
    processScore: Math.min(100, score),
    flat,
    planWritten,
    decisionsRecorded: session.decisions.length,
    breakerRespected,
    headline: flat
      ? 'Flat session, completed review'
      : session.account.tradesPlaced <= 3
        ? 'Selective session, completed review'
        : 'Active session, completed review',
    findings,
  };
}
