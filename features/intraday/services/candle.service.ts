import {
  INTRADAY_INTERVAL_MINUTES,
  type IntradayCandle,
  type IntradayInterval,
} from '../types/intraday.types';

export interface CandleValidation {
  ok: boolean;
  errors: string[];
}

const EPS = 1e-9;

/**
 * Validate candle invariants. Invalid candles are rejected explicitly —
 * missing data must never silently become a fabricated price.
 */
export function validateIntradayCandles(candles: readonly IntradayCandle[]): CandleValidation {
  const errors: string[] = [];
  let previousTimestamp = -Infinity;

  candles.forEach((candle, i) => {
    const label = `candle[${i}] @${candle.timestamp}`;
    for (const field of ['open', 'high', 'low', 'close'] as const) {
      if (!Number.isFinite(candle[field])) errors.push(`${label}: ${field} is not finite`);
    }
    if (Number.isFinite(candle.high) && Number.isFinite(candle.low)) {
      if (candle.high < candle.low - EPS) errors.push(`${label}: high is below low`);
      if (candle.high < Math.max(candle.open, candle.close) - EPS) {
        errors.push(`${label}: high is below open/close`);
      }
      if (candle.low > Math.min(candle.open, candle.close) + EPS) {
        errors.push(`${label}: low is above open/close`);
      }
    }
    if (!Number.isFinite(candle.volume) || candle.volume < 0) {
      errors.push(`${label}: volume must be finite and non-negative`);
    }
    if (candle.timestamp <= previousTimestamp) {
      errors.push(`${label}: timestamps must be strictly increasing`);
    }
    previousTimestamp = candle.timestamp;
  });

  return { ok: errors.length === 0, errors };
}

/**
 * Aggregate a 1m series into 3m/5m/15m candles. Aggregation is anchored at the
 * session start (first candle) so session boundaries are respected, and an
 * incomplete trailing group is still returned — labelled by its actual open.
 */
export function aggregateCandles(
  candles: readonly IntradayCandle[],
  interval: IntradayInterval,
): IntradayCandle[] {
  if (interval === '1m' || candles.length === 0) return [...candles];
  const groupSize = INTRADAY_INTERVAL_MINUTES[interval];
  const out: IntradayCandle[] = [];

  for (let start = 0; start < candles.length; start += groupSize) {
    const group = candles.slice(start, start + groupSize);
    const first = group[0]!;
    out.push({
      symbol: first.symbol,
      timestamp: first.timestamp,
      open: first.open,
      high: Math.max(...group.map((c) => c.high)),
      low: Math.min(...group.map((c) => c.low)),
      close: group[group.length - 1]!.close,
      volume: group.reduce((sum, c) => sum + c.volume, 0),
      interval,
      sessionId: first.sessionId,
      source: first.source,
      provenance: first.provenance,
    });
  }
  return out;
}

/** Session VWAP over the revealed candles. Zero total volume → null, never a guess. */
export function sessionVwap(candles: readonly IntradayCandle[]): number | null {
  let tpVolume = 0;
  let volume = 0;
  for (const candle of candles) {
    const typical = (candle.high + candle.low + candle.close) / 3;
    tpVolume += typical * candle.volume;
    volume += candle.volume;
  }
  return volume > 0 ? tpVolume / volume : null;
}

/** VWAP value at each prefix, for chart overlays. Null until volume exists. */
export function sessionVwapSeries(candles: readonly IntradayCandle[]): (number | null)[] {
  const out: (number | null)[] = [];
  let tpVolume = 0;
  let volume = 0;
  for (const candle of candles) {
    const typical = (candle.high + candle.low + candle.close) / 3;
    tpVolume += typical * candle.volume;
    volume += candle.volume;
    out.push(volume > 0 ? tpVolume / volume : null);
  }
  return out;
}
