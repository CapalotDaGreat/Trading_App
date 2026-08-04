import type { Candle, CandleInterval } from '@/shared/types/market';

import type { ReplayTvEpisode } from '@/features/decision-replay-tv/types/replay-tv.types';

/** Deterministic PRNG for educational reconstructions (not market data). */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function intervalMs(interval: CandleInterval): number {
  switch (interval) {
    case '1m':
      return 60_000;
    case '5m':
      return 5 * 60_000;
    case '15m':
      return 15 * 60_000;
    case '1h':
      return 60 * 60_000;
    case '4h':
      return 4 * 60 * 60_000;
    case '1d':
    default:
      return 24 * 60 * 60_000;
  }
}

function shapeDrift(
  shape: ReplayTvEpisode['pathShape'],
  i: number,
  n: number,
  rnd: () => number,
): number {
  const t = i / Math.max(1, n - 1);
  switch (shape) {
    case 'crash':
      return t < 0.35 ? 0.002 * (rnd() - 0.4) : -0.035 * (t - 0.35) - 0.01 * rnd();
    case 'meltup':
      return t < 0.4 ? 0.004 * (rnd() - 0.35) : 0.028 * (t - 0.35) + 0.008 * rnd();
    case 'whipsaw':
      return 0.02 * Math.sin(t * Math.PI * 4) + 0.01 * (rnd() - 0.5);
    case 'gap_down':
      return t < 0.55 ? 0.003 * (rnd() - 0.45) : t < 0.58 ? -0.12 : -0.01 * rnd();
    case 'slow_bleed':
      return -0.008 - 0.004 * t + 0.006 * (rnd() - 0.5);
    case 'squeeze':
      return t < 0.5 ? -0.01 * rnd() : 0.04 * (t - 0.45) + 0.01 * rnd();
    default:
      return 0.002 * (rnd() - 0.5);
  }
}

/**
 * Builds an educational OHLC path for Replay TV.
 * Labeled sample/approximate — never presented as live historical ticks.
 */
export function buildEducationalCandles(episode: ReplayTvEpisode): Candle[] {
  const rnd = mulberry32(episode.pathSeed);
  const step = intervalMs(episode.interval);
  const start = Date.UTC(2020, 0, 1) + (episode.pathSeed % 500) * step;
  let price = 100 + (episode.pathSeed % 40);
  const out: Candle[] = [];

  for (let i = 0; i < episode.barCount; i += 1) {
    const drift = shapeDrift(episode.pathShape, i, episode.barCount, rnd);
    const open = price;
    const close = Math.max(1, open * (1 + drift));
    const high = Math.max(open, close) * (1 + 0.004 * rnd());
    const low = Math.min(open, close) * (1 - 0.004 * rnd());
    const volume = Math.round(800_000 + rnd() * 2_200_000);
    out.push({
      timestamp: start + i * step,
      open,
      high,
      low,
      close,
      volume,
    });
    price = close;
  }

  return out;
}

export function visibleCandlesAt(full: Candle[], freezeIndex: number): Candle[] {
  const end = Math.min(full.length - 1, Math.max(0, freezeIndex));
  return full.slice(0, end + 1);
}
