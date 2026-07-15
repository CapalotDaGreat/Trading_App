export { calculateRsi, type IndicatorPoint, type RsiResult } from './rsi';
export { calculateMacd, type MacdPoint, type MacdResult } from './macd';
export { calculateEma, calculateEmaSeries } from './ema';
export { calculateSma, calculateSmaSeries } from './sma';
export { calculateBollinger, type BollingerPoint, type BollingerResult } from './bollinger';
export { calculateAtr, type AtrPoint, type AtrResult } from './atr';
export { calculateAdx, type AdxPoint, type AdxResult } from './adx';
export { calculateStochastic, type StochasticPoint, type StochasticResult } from './stochastic';
export { calculateVwap, type VwapPoint, type VwapResult } from './vwap';
export { calculateIchimoku, type IchimokuPoint, type IchimokuResult } from './ichimoku';
export {
  calculateFibonacci,
  calculateFibonacciExtension,
  type FibonacciLevel,
  type FibonacciResult,
} from './fibonacci';

export type IndicatorType =
  | 'rsi'
  | 'macd'
  | 'ema'
  | 'sma'
  | 'bollinger'
  | 'atr'
  | 'adx'
  | 'stochastic'
  | 'vwap'
  | 'ichimoku'
  | 'fibonacci';

export const INDICATOR_LABELS: Record<IndicatorType, string> = {
  rsi: 'RSI',
  macd: 'MACD',
  ema: 'EMA',
  sma: 'SMA',
  bollinger: 'Bollinger Bands',
  atr: 'ATR',
  adx: 'ADX',
  stochastic: 'Stochastic',
  vwap: 'VWAP',
  ichimoku: 'Ichimoku',
  fibonacci: 'Fibonacci',
};
