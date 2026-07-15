import type { Candle } from '@/shared/types/market';

export type BacktestSignal = 'buy' | 'sell' | 'hold';

export interface BacktestStrategy {
  name: string;
  generateSignal: (candles: Candle[], index: number) => BacktestSignal;
}

export interface BacktestTrade {
  entryIndex: number;
  exitIndex: number;
  entryPrice: number;
  exitPrice: number;
  direction: 'long' | 'short';
  pnl: number;
  pnlPercent: number;
}

export interface BacktestConfig {
  initialCapital: number;
  positionSizePercent: number;
  commission: number;
  slippage: number;
}

export interface BacktestResult {
  strategy: string;
  trades: BacktestTrade[];
  totalReturn: number;
  totalReturnPercent: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  finalCapital: number;
  equityCurve: { index: number; equity: number }[];
}

export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
  initialCapital: 10_000,
  positionSizePercent: 10,
  commission: 0,
  slippage: 0.001,
};

export function smaStrategy(period: number): BacktestStrategy {
  return {
    name: `SMA Crossover (${period}/${period * 2})`,
    generateSignal: (candles, index) => {
      const slowPeriod = period * 2;
      if (index < slowPeriod) return 'hold';

      const fast = calculateSma(candles, index, period);
      const slow = calculateSma(candles, index, slowPeriod);
      const prevFast = calculateSma(candles, index - 1, period);
      const prevSlow = calculateSma(candles, index - 1, slowPeriod);

      if (prevFast <= prevSlow && fast > slow) return 'buy';
      if (prevFast >= prevSlow && fast < slow) return 'sell';
      return 'hold';
    },
  };
}

export function rsiStrategy(period = 14, oversold = 30, overbought = 70): BacktestStrategy {
  return {
    name: `RSI Mean Reversion (${period})`,
    generateSignal: (candles, index) => {
      if (index < period + 1) return 'hold';

      const rsi = calculateRsi(candles, index, period);
      if (rsi < oversold) return 'buy';
      if (rsi > overbought) return 'sell';
      return 'hold';
    },
  };
}

function calculateSma(candles: Candle[], index: number, period: number): number {
  const start = Math.max(0, index - period + 1);
  const slice = candles.slice(start, index + 1);
  if (slice.length === 0) return 0;
  return slice.reduce((sum, c) => sum + c.close, 0) / slice.length;
}

function calculateRsi(candles: Candle[], index: number, period: number): number {
  let gains = 0;
  let losses = 0;

  for (let i = index - period + 1; i <= index; i += 1) {
    const change = candles[i]!.close - candles[i - 1]!.close;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function runBacktest(
  candles: Candle[],
  strategy: BacktestStrategy,
  config: BacktestConfig = DEFAULT_BACKTEST_CONFIG,
): BacktestResult {
  const trades: BacktestTrade[] = [];
  const equityCurve: { index: number; equity: number }[] = [];

  let capital = config.initialCapital;
  let position: { entryIndex: number; entryPrice: number; shares: number } | null = null;
  let peakEquity = capital;
  let maxDrawdown = 0;
  const returns: number[] = [];

  for (let i = 1; i < candles.length; i += 1) {
    const signal = strategy.generateSignal(candles, i);
    const price = candles[i]!.close;
    const slippageMultiplier = 1 + config.slippage;

    if (signal === 'buy' && !position) {
      const positionValue = capital * (config.positionSizePercent / 100);
      const entryPrice = price * slippageMultiplier;
      const shares = Math.floor(positionValue / entryPrice);
      if (shares > 0) {
        position = { entryIndex: i, entryPrice, shares };
        capital -= shares * entryPrice + config.commission;
      }
    } else if (signal === 'sell' && position) {
      const exitPrice = price / slippageMultiplier;
      const proceeds = position.shares * exitPrice - config.commission;
      const cost = position.shares * position.entryPrice;
      const pnl = proceeds - cost;
      const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

      trades.push({
        entryIndex: position.entryIndex,
        exitIndex: i,
        entryPrice: position.entryPrice,
        exitPrice,
        direction: 'long',
        pnl,
        pnlPercent,
      });

      capital += proceeds;
      returns.push(pnlPercent);
      position = null;
    }

    const markToMarket = position
      ? capital + position.shares * price
      : capital;

    equityCurve.push({ index: i, equity: markToMarket });

    if (markToMarket > peakEquity) peakEquity = markToMarket;
    const drawdown = peakEquity > 0 ? (peakEquity - markToMarket) / peakEquity : 0;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  if (position) {
    const lastPrice = candles[candles.length - 1]!.close;
    const proceeds = position.shares * lastPrice;
    const cost = position.shares * position.entryPrice;
    const pnl = proceeds - cost;

    trades.push({
      entryIndex: position.entryIndex,
      exitIndex: candles.length - 1,
      entryPrice: position.entryPrice,
      exitPrice: lastPrice,
      direction: 'long',
      pnl,
      pnlPercent: cost > 0 ? (pnl / cost) * 100 : 0,
    });

    capital += proceeds;
  }

  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const totalReturn = capital - config.initialCapital;
  const totalReturnPercent = (totalReturn / config.initialCapital) * 100;
  const sharpeRatio = calculateSharpeRatio(returns);

  return {
    strategy: strategy.name,
    trades,
    totalReturn,
    totalReturnPercent,
    winRate,
    maxDrawdown: maxDrawdown * 100,
    sharpeRatio,
    profitFactor,
    finalCapital: capital,
    equityCurve,
  };
}

function calculateSharpeRatio(returns: number[]): number {
  if (returns.length < 2) return 0;

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;
  return (mean / stdDev) * Math.sqrt(252);
}

export function generateSampleCandles(count = 200, startPrice = 100): Candle[] {
  const candles: Candle[] = [];
  let price = startPrice;
  const now = Date.now();

  for (let i = 0; i < count; i += 1) {
    const change = (Math.random() - 0.48) * 2;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random();
    const low = Math.min(open, close) - Math.random();

    candles.push({
      timestamp: now - (count - i) * 24 * 60 * 60 * 1000,
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 1_000_000),
    });

    price = close;
  }

  return candles;
}
