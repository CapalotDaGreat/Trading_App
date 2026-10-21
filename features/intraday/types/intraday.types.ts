/**
 * Intraday (day-trading / scalping) education model.
 *
 * Everything here is simulated education. Candles are either clearly labelled
 * synthetic scenarios or historical data with documented provenance — this app
 * never fabricates historical prices and never executes live orders.
 */

export type IntradayInterval = '1m' | '3m' | '5m' | '15m';

export const INTRADAY_INTERVAL_MINUTES: Record<IntradayInterval, number> = {
  '1m': 1,
  '3m': 3,
  '5m': 5,
  '15m': 15,
};

export type IntradayCandleSource = 'synthetic' | 'historical';

export interface IntradayCandle {
  /** Instrument identifier (fictional symbol for synthetic scenarios). */
  symbol: string;
  /** Epoch milliseconds of the candle open. */
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  /** Non-negative. Zero means "no recorded participation", never a fabricated price. */
  volume: number;
  interval: IntradayInterval;
  sessionId: string;
  source: IntradayCandleSource;
  /** Human-readable provenance, e.g. "Synthetic educational scenario (seeded rules)". */
  provenance: string;
}

export type IntradayScenarioKind =
  'trend-day' | 'range-day' | 'failed-breakout' | 'quiet-day' | 'volatile-day';

export interface IntradaySessionStage {
  id: 'opening' | 'development' | 'mid-session' | 'late-session' | 'close';
  label: string;
  /** Index of the first candle (in the base 1m series) belonging to this stage. */
  fromCandleIndex: number;
  note: string;
}

export interface IntradayScenario {
  id: string;
  symbol: string;
  /** Never shown to the learner before they commit — kept out of UI labels. */
  kind: IntradayScenarioKind;
  sessionId: string;
  /** Base series, always 1m. Aggregate for 3m/5m/15m views. */
  candles: IntradayCandle[];
  stages: IntradaySessionStage[];
  source: IntradayCandleSource;
  provenance: string;
  /** Educational framing shown before the session starts. No outcome leak. */
  briefing: string;
}

export interface ReplayState {
  /** Index of the last revealed candle. -1 reveals nothing. */
  cursor: number;
  playing: boolean;
  /** Candles advanced per playback tick. */
  speed: 1 | 2 | 4;
  totalCandles: number;
}

export type IntradayOrderType = 'market' | 'limit' | 'stop_market' | 'stop_limit';
export type IntradayOrderSide = 'buy' | 'sell';
export type IntradayOrderStatus =
  'pending' | 'partially_filled' | 'filled' | 'cancelled' | 'rejected' | 'expired';

export interface IntradayOrder {
  id: string;
  side: IntradayOrderSide;
  type: IntradayOrderType;
  quantity: number;
  filledQuantity: number;
  status: IntradayOrderStatus;
  limitPrice?: number;
  stopPrice?: number;
  /** Protective exit attached at entry. Evaluated conservatively (stop first). */
  takeProfitPrice?: number;
  protectiveStopPrice?: number;
  /** Candle index at submission (on the series being traded). */
  submittedAtCandle: number;
  /** Expire after this many candles without a fill. */
  expiresAfterCandles?: number;
  /** True once a stop_limit has triggered and converted to a limit order. */
  triggered?: boolean;
  rejectReason?: string;
}

export interface IntradayFill {
  orderId: string;
  candleIndex: number;
  timestamp: number;
  side: IntradayOrderSide;
  quantity: number;
  /** Raw reference price before spread/slippage. */
  rawPrice: number;
  /** Actual simulated fill price after spread and slippage. */
  fillPrice: number;
  spreadCost: number;
  slippageCost: number;
  fee: number;
}

export interface ExecutionConfig {
  /** Full bid/ask spread in basis points of price. Half is charged per fill. */
  spreadBps: number;
  /** Adverse slippage in basis points, applied deterministically per fill. */
  slippageBps: number;
  /** Flat commission per fill. */
  feePerFill: number;
  /** Whole candles of simulated latency before an order can fill. */
  latencyCandles: number;
  /** Fraction of candle volume available to this learner (partial fills). */
  participationRate: number;
}

export interface ExecutionAccount {
  cash: number;
  /** Signed position quantity. Positive = long, negative = short. */
  positionQty: number;
  averageEntryPrice: number;
  realizedGross: number;
  feesTotal: number;
  spreadCostTotal: number;
  slippageCostTotal: number;
  fills: IntradayFill[];
  closedTrades: number;
  losingTrades: number;
  consecutiveLosses: number;
  tradesPlaced: number;
}

export interface DailyRiskConfig {
  equity: number;
  /** Maximum planned loss per trade, as a fraction of equity (educational example values). */
  maxRiskPercentPerTrade: number;
  /** Circuit breaker: stop opening new risk when session P/L reaches this loss (currency). */
  maxDailyLoss: number;
  maxTrades?: number;
  maxConsecutiveLosses?: number;
}

export interface RiskGateResult {
  circuitBreakerActive: boolean;
  canOpenRisk: boolean;
  canReduceRisk: boolean;
  reasons: string[];
  sessionPnl: number;
  riskBudgetPerTrade: number;
}
