import { calculateVwap } from '@/features/charts/utils/indicators/vwap';

import type { IntradayCandle, IntradayOrder } from '../../types/intraday.types';
import { aggregateCandles, sessionVwap, validateIntradayCandles } from '../candle.service';
import {
  canTransitionOrder,
  createExecutionAccount,
  executeOrderOnCandle,
  netSessionPnl,
  protectiveExitPrice,
  transitionOrder,
} from '../execution.service';
import {
  advance,
  createReplay,
  isReplayComplete,
  replayProgress,
  resetReplay,
  stepBackward,
  stepForward,
  visibleCandles,
} from '../replay-engine.service';
import { evaluateRiskGate, isRiskIncreasing, sizeFromRiskBudget } from '../risk-controls.service';
import { generateSyntheticSession } from '../synthetic-session.service';
import {
  advanceSession,
  createTradingDaySession,
  reviewSession,
  submitSessionOrder,
} from '../trading-day.service';

function candle(partial: Partial<IntradayCandle> & { timestamp: number }): IntradayCandle {
  return {
    symbol: 'DAYX',
    open: 100,
    high: 101,
    low: 99,
    close: 100.5,
    volume: 10_000,
    interval: '1m',
    sessionId: 'test-session',
    source: 'synthetic',
    provenance: 'test fixture',
    ...partial,
  };
}

function order(partial: Partial<IntradayOrder>): IntradayOrder {
  return {
    id: 'o1',
    side: 'buy',
    type: 'market',
    quantity: 100,
    filledQuantity: 0,
    status: 'pending',
    submittedAtCandle: 0,
    ...partial,
  };
}

const CFG = {
  spreadBps: 4,
  slippageBps: 2,
  feePerFill: 0.5,
  latencyCandles: 1,
  participationRate: 1,
};

describe('candle validation', () => {
  it('accepts a valid series and rejects invariant violations', () => {
    expect(validateIntradayCandles([candle({ timestamp: 1 }), candle({ timestamp: 2 })]).ok).toBe(
      true,
    );
    expect(validateIntradayCandles([candle({ timestamp: 1, high: 100.2 })]).ok).toBe(false); // high < close
    expect(validateIntradayCandles([candle({ timestamp: 1, volume: -5 })]).ok).toBe(false);
    expect(validateIntradayCandles([candle({ timestamp: 2 }), candle({ timestamp: 1 })]).ok).toBe(
      false,
    );
    expect(validateIntradayCandles([candle({ timestamp: 1, close: Number.NaN })]).ok).toBe(false);
  });

  it('aggregates 1m into 5m with correct OHLCV', () => {
    const base = Array.from({ length: 5 }, (_, i) =>
      candle({
        timestamp: i * 60_000,
        open: 100 + i,
        high: 102 + i,
        low: 99 + i,
        close: 101 + i,
        volume: 100,
      }),
    );
    const [agg] = aggregateCandles(base, '5m');
    expect(agg).toMatchObject({
      open: 100,
      high: 106,
      low: 99,
      close: 105,
      volume: 500,
      interval: '5m',
    });
  });

  it('VWAP matches the shared chart indicator and is null on zero volume', () => {
    const candles = [
      candle({ timestamp: 0, high: 102, low: 98, close: 100, volume: 300 }),
      candle({ timestamp: 60_000, high: 104, low: 100, close: 102, volume: 100 }),
    ];
    expect(sessionVwap(candles)).toBeCloseTo(calculateVwap(candles).values[1]!.value, 10);
    expect(sessionVwap([candle({ timestamp: 0, volume: 0 })])).toBeNull();
  });
});

describe('synthetic sessions', () => {
  it('are deterministic per seed, labelled synthetic, and valid', () => {
    const a = generateSyntheticSession({ seed: 42 });
    const b = generateSyntheticSession({ seed: 42 });
    const c = generateSyntheticSession({ seed: 43 });
    expect(a.candles.map((x) => x.close)).toEqual(b.candles.map((x) => x.close));
    expect(a.candles.map((x) => x.close)).not.toEqual(c.candles.map((x) => x.close));
    expect(a.source).toBe('synthetic');
    expect(a.provenance).toMatch(/Synthetic educational/);
    expect(validateIntradayCandles(a.candles).ok).toBe(true);
    expect(a.stages).toHaveLength(5);
  });
});

describe('replay engine concealment', () => {
  const candles = generateSyntheticSession({ seed: 7 }).candles;
  it('never reveals future candles and supports step/back/reset', () => {
    let state = createReplay(candles.length);
    expect(visibleCandles(candles, state)).toHaveLength(1);
    state = stepForward(stepForward(state));
    const visible = visibleCandles(candles, state);
    expect(visible).toHaveLength(3);
    expect(visible[visible.length - 1]).toBe(candles[2]);
    state = stepBackward(state);
    expect(visibleCandles(candles, state)).toHaveLength(2);
    state = resetReplay(state);
    expect(replayProgress(state)).toBeCloseTo(1 / candles.length);
    while (!isReplayComplete(state)) state = stepForward(state);
    expect(visibleCandles(candles, state)).toHaveLength(candles.length);
    expect(stepForward(state).cursor).toBe(candles.length - 1);
    expect(advance(createReplay(10)).cursor).toBe(1);
  });
});

describe('execution model', () => {
  it('fills a market order after latency, charging spread, slippage, and fees separately', () => {
    const account = createExecutionAccount(100_000);
    const tooEarly = executeOrderOnCandle({
      account,
      order: order({}),
      candle: candle({
        timestamp: 0,
        open: 100,
        high: 100.5,
        low: 99.5,
        close: 100,
        volume: 1_000,
      }),
      candleIndex: 0,
      config: CFG,
    });
    expect(tooEarly.fills).toHaveLength(0);

    const result = executeOrderOnCandle({
      account,
      order: order({}),
      candle: candle({
        timestamp: 60_000,
        open: 100,
        high: 100.5,
        low: 99.5,
        close: 100,
        volume: 1_000,
      }),
      candleIndex: 1,
      config: CFG,
    });
    expect(result.order.status).toBe('filled');
    const fill = result.fills[0]!;
    expect(fill.fillPrice).toBeGreaterThan(100); // buy pays up through spread+slippage
    expect(fill.spreadCost).toBeGreaterThan(0);
    expect(fill.slippageCost).toBeGreaterThan(0);
    expect(fill.fee).toBe(0.5);
    expect(result.account.positionQty).toBe(100);
    expect(result.account.cash).toBeCloseTo(100_000 - 100 * fill.fillPrice - 0.5, 2);
    expect(result.account.feesTotal).toBe(0.5);
  });

  it('limit orders fill at the level or better, and wait when untouched', () => {
    const account = createExecutionAccount(100_000);
    const waiting = executeOrderOnCandle({
      account,
      order: order({ type: 'limit', limitPrice: 98 }),
      candle: candle({ timestamp: 0, open: 100, high: 101, low: 99, close: 100 }),
      candleIndex: 1,
      config: CFG,
    });
    expect(waiting.fills).toHaveLength(0);
    expect(waiting.order.status).toBe('pending');

    const filled = executeOrderOnCandle({
      account,
      order: order({ type: 'limit', limitPrice: 99.5 }),
      candle: candle({ timestamp: 0, open: 99, high: 100, low: 98.5, close: 99.8 }),
      candleIndex: 1,
      config: CFG,
    });
    expect(filled.fills[0]!.rawPrice).toBe(99); // price improvement to the open
  });

  it('stop-market gaps through and stop-limit can trigger without filling', () => {
    const account = createExecutionAccount(100_000);
    const gapped = executeOrderOnCandle({
      account,
      order: order({ side: 'sell', type: 'stop_market', stopPrice: 99.5 }),
      candle: candle({ timestamp: 0, open: 98.9, high: 99.2, low: 98.5, close: 98.8 }),
      candleIndex: 1,
      config: CFG,
    });
    expect(gapped.fills[0]!.rawPrice).toBe(98.9); // open, worse than the stop

    const stopLimit = executeOrderOnCandle({
      account,
      order: order({ side: 'sell', type: 'stop_limit', stopPrice: 99.5, limitPrice: 99.4 }),
      candle: candle({ timestamp: 0, open: 98.9, high: 99.2, low: 98.5, close: 98.8 }),
      candleIndex: 1,
      config: CFG,
    });
    expect(stopLimit.fills).toHaveLength(0); // triggered conceptually, limit never reached
  });

  it('partially fills against thin volume and never fabricates fills on zero volume', () => {
    const account = createExecutionAccount(100_000);
    const partial = executeOrderOnCandle({
      account,
      order: order({ quantity: 500 }),
      candle: candle({ timestamp: 0, volume: 120 }),
      candleIndex: 1,
      config: { ...CFG, participationRate: 0.5 },
    });
    expect(partial.fills[0]!.quantity).toBe(60);
    expect(partial.order.status).toBe('partially_filled');

    const none = executeOrderOnCandle({
      account,
      order: order({}),
      candle: candle({ timestamp: 0, volume: 0 }),
      candleIndex: 1,
      config: CFG,
    });
    expect(none.fills).toHaveLength(0);
  });

  it('enforces the order state machine and conservative stop-first ambiguity', () => {
    expect(canTransitionOrder('pending', 'filled')).toBe(true);
    expect(canTransitionOrder('filled', 'cancelled')).toBe(false);
    expect(() => transitionOrder(order({ status: 'filled' }), 'cancelled')).toThrow();
    const both = protectiveExitPrice({
      positionQty: 100,
      protectiveStopPrice: 99,
      takeProfitPrice: 102,
      candle: candle({ timestamp: 0, high: 103, low: 98, open: 100, close: 101 }),
    });
    expect(both?.kind).toBe('stop');
  });

  it('realizes P/L on close and reconciles net of costs', () => {
    let account = createExecutionAccount(100_000);
    const buy = executeOrderOnCandle({
      account,
      order: order({}),
      candle: candle({ timestamp: 0, open: 100, high: 100.4, low: 99.6, close: 100 }),
      candleIndex: 1,
      config: CFG,
    });
    account = buy.account;
    const sell = executeOrderOnCandle({
      account,
      order: order({ id: 'o2', side: 'sell' }),
      candle: candle({ timestamp: 60_000, open: 102, high: 102.4, low: 101.6, close: 102 }),
      candleIndex: 2,
      config: CFG,
    });
    account = sell.account;
    expect(account.positionQty).toBe(0);
    expect(account.closedTrades).toBe(1);
    expect(account.realizedGross).toBeGreaterThan(0);
    const net = netSessionPnl(account);
    expect(net).toBeLessThan(account.realizedGross); // costs are real subtractions
    expect(net).toBeCloseTo(
      account.realizedGross -
        account.feesTotal -
        account.spreadCostTotal -
        account.slippageCostTotal,
      2,
    );
  });
});

describe('risk controls', () => {
  it('sizes from risk budget and invalidation distance', () => {
    const result = sizeFromRiskBudget({
      equity: 50_000,
      riskPercent: 0.005,
      entryPrice: 100,
      invalidationPrice: 98.5,
    });
    expect(result.riskBudget).toBe(250);
    expect(result.quantity).toBe(166);
    expect(
      sizeFromRiskBudget({
        equity: 50_000,
        riskPercent: 0.005,
        entryPrice: 100,
        invalidationPrice: 100,
      }).quantity,
    ).toBe(0);
  });

  it('circuit breaker blocks new risk but never risk reduction', () => {
    const account = {
      ...createExecutionAccount(100_000),
      realizedGross: -2_500,
      positionQty: 100,
      averageEntryPrice: 100,
    };
    const gate = evaluateRiskGate({
      account,
      config: { equity: 100_000, maxRiskPercentPerTrade: 0.005, maxDailyLoss: 2_000 },
      markPrice: 100,
    });
    expect(gate.circuitBreakerActive).toBe(true);
    expect(gate.canOpenRisk).toBe(false);
    expect(gate.canReduceRisk).toBe(true);
    expect(isRiskIncreasing(account, 'sell', 50)).toBe(false);
    expect(isRiskIncreasing(account, 'buy', 10)).toBe(true);
  });
});

describe('trading day session', () => {
  it('requires a plan before orders, executes on later candles, and completes flat as success', () => {
    let session = createTradingDaySession({ seed: 99 });
    const blocked = submitSessionOrder(session, order({}));
    expect(blocked.accepted).toBe(false);

    session = {
      ...session,
      preSessionPlan: 'Range day plan: wait for acceptance, max loss set, flat is fine.',
    };
    const placed = submitSessionOrder(session, order({}));
    expect(placed.accepted).toBe(true);
    session = placed.session;
    session = advanceSession(session);
    expect(session.account.fills.length).toBeGreaterThan(0);

    const flat = createTradingDaySession({ seed: 5 });
    const review = reviewSession(
      { ...flat, preSessionPlan: 'Observe only today; no acceptance, no trade.' },
      'Watched the whole tape, declined two pokes, journal complete.',
    );
    expect(review.flat).toBe(true);
    expect(review.processScore).toBeGreaterThanOrEqual(85);
  });

  it('activates the daily-loss breaker inside a session', () => {
    let session = createTradingDaySession({
      seed: 12,
      risk: { equity: 100_000, maxRiskPercentPerTrade: 0.005, maxDailyLoss: 1 },
    });
    session = {
      ...session,
      preSessionPlan: 'Tight-limit training day: practise stopping on purpose.',
      account: { ...session.account, realizedGross: -50 },
    };
    session = advanceSession(session);
    expect(session.breakerEvents.length).toBe(1);
    const after = submitSessionOrder(session, order({ id: 'late' }));
    expect(after.accepted).toBe(false);
    expect(after.session.orders[after.session.orders.length - 1]!.status).toBe('rejected');
  });
});
