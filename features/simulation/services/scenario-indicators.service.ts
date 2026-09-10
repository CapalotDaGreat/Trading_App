import type { SimulationBar } from '../types/scenario.types';

/**
 * Indicators use only the bars passed in. Callers must pass the visible slice.
 */
export function simpleMovingAverage(bars: SimulationBar[], period: number): Array<number | null> {
  return bars.map((_, index) => {
    if (index + 1 < period) return null;
    const window = bars.slice(index + 1 - period, index + 1);
    const sum = window.reduce((acc, bar) => acc + bar.close, 0);
    return sum / period;
  });
}

export function relativeStrengthIndex(bars: SimulationBar[], period = 14): Array<number | null> {
  const values: Array<number | null> = bars.map(() => null);
  if (bars.length <= period) return values;

  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = bars[i]!.close - bars[i - 1]!.close;
    if (change >= 0) gain += change;
    else loss -= change;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  values[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < bars.length; i += 1) {
    const change = bars[i]!.close - bars[i - 1]!.close;
    const up = change > 0 ? change : 0;
    const down = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + up) / period;
    avgLoss = (avgLoss * (period - 1) + down) / period;
    values[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return values;
}

export function indicatorAt(
  values: Array<number | null>,
  index: number,
): number | null {
  if (index < 0 || index >= values.length) return null;
  return values[index] ?? null;
}
