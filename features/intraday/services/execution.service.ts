import type {
  ExecutionAccount,
  ExecutionConfig,
  IntradayCandle,
  IntradayFill,
  IntradayOrder,
  IntradayOrderStatus,
} from '../types/intraday.types';

/**
 * Deterministic educational execution model.
 *
 * Assumptions (documented, deliberately conservative):
 * - Prices derive only from revealed candles. No fill is ever fabricated.
 * - A candle cannot tell us intrabar ordering. If a protective stop and a
 *   take-profit are both touched in one candle, the STOP is evaluated first.
 * - Market/stop fills cross the spread and pay deterministic slippage.
 * - Limit fills get price improvement to the candle open, never beyond it.
 * - A stop gapped through fills at the (worse) candle open, not the stop price.
 * - Liquidity per candle is candle volume × participation rate; otherwise
 *   orders partially fill or wait. Zero volume means no fill.
 * This does not replicate a real exchange order book and never claims to.
 */

export const DEFAULT_EXECUTION_CONFIG: ExecutionConfig = {
  spreadBps: 4,
  slippageBps: 2,
  feePerFill: 0.5,
  latencyCandles: 1,
  participationRate: 0.05,
};

/** Legal order-status transitions. Anything else is rejected explicitly. */
export const ORDER_TRANSITIONS: Record<IntradayOrderStatus, IntradayOrderStatus[]> = {
  pending: ['partially_filled', 'filled', 'cancelled', 'rejected', 'expired'],
  partially_filled: ['partially_filled', 'filled', 'cancelled', 'expired'],
  filled: [],
  cancelled: [],
  rejected: [],
  expired: [],
};

export function canTransitionOrder(from: IntradayOrderStatus, to: IntradayOrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export function transitionOrder(order: IntradayOrder, to: IntradayOrderStatus): IntradayOrder {
  if (order.status === to) return order;
  if (!canTransitionOrder(order.status, to)) {
    throw new Error(`Invalid order transition ${order.status} -> ${to}`);
  }
  return { ...order, status: to };
}

export function createExecutionAccount(startingCash: number): ExecutionAccount {
  return {
    cash: roundMoney(startingCash),
    positionQty: 0,
    averageEntryPrice: 0,
    realizedGross: 0,
    feesTotal: 0,
    spreadCostTotal: 0,
    slippageCostTotal: 0,
    fills: [],
    closedTrades: 0,
    losingTrades: 0,
    consecutiveLosses: 0,
    tradesPlaced: 0,
  };
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function adverse(price: number, side: IntradayOrder['side'], bps: number): number {
  const delta = price * (bps / 10_000);
  return side === 'buy' ? delta : -delta;
}

export interface CandleExecutionResult {
  account: ExecutionAccount;
  order: IntradayOrder;
  fills: IntradayFill[];
}

/**
 * Try to execute an order against one candle. `candleIndex` is the index of
 * that candle on the traded series; latency is measured from submission.
 */
export function executeOrderOnCandle(input: {
  account: ExecutionAccount;
  order: IntradayOrder;
  candle: IntradayCandle;
  candleIndex: number;
  config?: ExecutionConfig;
}): CandleExecutionResult {
  const config = input.config ?? DEFAULT_EXECUTION_CONFIG;
  const { candle, candleIndex } = input;
  let order = input.order;
  let account = input.account;
  const fills: IntradayFill[] = [];

  if (
    order.status === 'filled' ||
    order.status === 'cancelled' ||
    order.status === 'rejected' ||
    order.status === 'expired'
  ) {
    return { account, order, fills };
  }

  // Latency: the order cannot fill inside the submission candle.
  if (candleIndex - order.submittedAtCandle < config.latencyCandles) {
    return { account, order, fills };
  }

  // Expiry.
  if (
    order.expiresAfterCandles != null &&
    candleIndex - order.submittedAtCandle > order.expiresAfterCandles
  ) {
    return { account, order: transitionOrder(order, 'expired'), fills };
  }

  const rawPrice = referencePrice(order, candle);
  if (rawPrice == null) return { account, order, fills };

  // Available liquidity this candle.
  const available = Math.floor(candle.volume * config.participationRate);
  const remaining = order.quantity - order.filledQuantity;
  const fillQty = Math.min(remaining, available);
  if (fillQty <= 0) {
    // Insufficient simulated liquidity: the order waits (never fabricate a fill).
    return { account, order, fills };
  }

  const halfSpreadBps = config.spreadBps / 2;
  const spreadPerUnit = Math.abs(adverse(rawPrice, order.side, halfSpreadBps));
  const slippagePerUnit = Math.abs(adverse(rawPrice, order.side, config.slippageBps));
  const signedFill =
    rawPrice +
    adverse(rawPrice, order.side, halfSpreadBps) +
    adverse(rawPrice, order.side, config.slippageBps);
  const fillPrice = Math.max(0.01, signedFill);

  const fill: IntradayFill = {
    orderId: order.id,
    candleIndex,
    timestamp: candle.timestamp,
    side: order.side,
    quantity: fillQty,
    rawPrice: roundMoney(rawPrice),
    fillPrice: roundMoney(fillPrice),
    spreadCost: roundMoney(spreadPerUnit * fillQty),
    slippageCost: roundMoney(slippagePerUnit * fillQty),
    fee: config.feePerFill,
  };
  fills.push(fill);
  account = applyFill(account, fill);
  const filledQuantity = order.filledQuantity + fillQty;
  order = {
    ...order,
    filledQuantity,
    status: filledQuantity >= order.quantity ? 'filled' : 'partially_filled',
  };
  if (account !== input.account) {
    account = {
      ...account,
      tradesPlaced: input.account.tradesPlaced + (input.order.filledQuantity === 0 ? 1 : 0),
    };
  }
  return { account, order, fills };
}

/** Reference (pre-cost) price if the order's condition is met on this candle, else null. */
function referencePrice(order: IntradayOrder, candle: IntradayCandle): number | null {
  switch (order.type) {
    case 'market':
      return candle.open;
    case 'limit': {
      if (order.limitPrice == null) return null;
      if (order.side === 'buy' && candle.low <= order.limitPrice) {
        return Math.min(candle.open, order.limitPrice);
      }
      if (order.side === 'sell' && candle.high >= order.limitPrice) {
        return Math.max(candle.open, order.limitPrice);
      }
      return null;
    }
    case 'stop_market': {
      if (order.stopPrice == null) return null;
      if (order.side === 'buy' && candle.high >= order.stopPrice) {
        // Gap through the stop fills at the open — worse, never better.
        return Math.max(candle.open, order.stopPrice);
      }
      if (order.side === 'sell' && candle.low <= order.stopPrice) {
        return Math.min(candle.open, order.stopPrice);
      }
      return null;
    }
    case 'stop_limit': {
      if (order.stopPrice == null || order.limitPrice == null) return null;
      if (!order.triggered) {
        const hit =
          order.side === 'buy' ? candle.high >= order.stopPrice : candle.low <= order.stopPrice;
        if (!hit) return null;
        order.triggered = true;
      }
      if (order.side === 'buy' && candle.low <= order.limitPrice) {
        return Math.min(candle.open, order.limitPrice);
      }
      if (order.side === 'sell' && candle.high >= order.limitPrice) {
        return Math.max(candle.open, order.limitPrice);
      }
      return null;
    }
  }
}

/** Apply a fill to the account with signed-position accounting. */
export function applyFill(account: ExecutionAccount, fill: IntradayFill): ExecutionAccount {
  const signedQty = fill.side === 'buy' ? fill.quantity : -fill.quantity;
  let {
    positionQty,
    averageEntryPrice,
    realizedGross,
    closedTrades,
    losingTrades,
    consecutiveLosses,
  } = account;

  const closing = positionQty !== 0 && Math.sign(signedQty) !== Math.sign(positionQty);
  const closedQty = closing ? Math.min(Math.abs(positionQty), fill.quantity) : 0;
  if (closedQty > 0) {
    const direction = Math.sign(positionQty);
    const gross = (fill.fillPrice - averageEntryPrice) * closedQty * direction;
    realizedGross = roundMoney(realizedGross + gross);
    // Trade-level outcome is only counted when the position fully closes.
    if (fill.quantity >= Math.abs(positionQty)) {
      closedTrades += 1;
      if (gross < 0) {
        losingTrades += 1;
        consecutiveLosses += 1;
      } else if (gross > 0) {
        consecutiveLosses = 0;
      }
    }
  }

  const newQty = positionQty + signedQty;
  if (newQty === 0) {
    averageEntryPrice = 0;
  } else if (!closing || fill.quantity > Math.abs(positionQty)) {
    const openedQty = closing ? Math.abs(newQty) : fill.quantity;
    const priorOpenQty = closing ? 0 : Math.abs(positionQty);
    averageEntryPrice =
      (averageEntryPrice * priorOpenQty + fill.fillPrice * openedQty) /
      Math.max(1, priorOpenQty + openedQty);
  }
  positionQty = newQty;

  return {
    ...account,
    cash: roundMoney(account.cash - signedQty * fill.fillPrice - fill.fee),
    positionQty,
    averageEntryPrice: roundMoney(averageEntryPrice),
    realizedGross,
    feesTotal: roundMoney(account.feesTotal + fill.fee),
    spreadCostTotal: roundMoney(account.spreadCostTotal + fill.spreadCost),
    slippageCostTotal: roundMoney(account.slippageCostTotal + fill.slippageCost),
    fills: [...account.fills, fill],
    closedTrades,
    losingTrades,
    consecutiveLosses,
  };
}

/**
 * Evaluate a position's protective stop / take-profit against a candle.
 * Conservative intrabar rule: when both are touched, the stop wins.
 * Returns the exit reference price, or null when neither is touched.
 */
export function protectiveExitPrice(input: {
  positionQty: number;
  protectiveStopPrice?: number;
  takeProfitPrice?: number;
  candle: IntradayCandle;
}): { kind: 'stop' | 'target'; rawPrice: number } | null {
  const { positionQty, candle } = input;
  if (positionQty === 0) return null;
  const long = positionQty > 0;
  const stopHit =
    input.protectiveStopPrice != null &&
    (long ? candle.low <= input.protectiveStopPrice : candle.high >= input.protectiveStopPrice);
  if (stopHit) {
    // Gaps through the stop fill at the open.
    const raw = long
      ? Math.min(candle.open, input.protectiveStopPrice!)
      : Math.max(candle.open, input.protectiveStopPrice!);
    return { kind: 'stop', rawPrice: raw };
  }
  const targetHit =
    input.takeProfitPrice != null &&
    (long ? candle.high >= input.takeProfitPrice : candle.low <= input.takeProfitPrice);
  if (targetHit) return { kind: 'target', rawPrice: input.takeProfitPrice! };
  return null;
}

/** Net session P/L: realized gross minus every tracked cost, plus open mark. */
export function netSessionPnl(account: ExecutionAccount, markPrice?: number): number {
  let unrealized = 0;
  if (account.positionQty !== 0 && markPrice != null) {
    unrealized = (markPrice - account.averageEntryPrice) * account.positionQty;
  }
  return roundMoney(
    account.realizedGross -
      account.feesTotal -
      account.spreadCostTotal -
      account.slippageCostTotal +
      unrealized,
  );
}
