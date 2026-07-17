import type { Candle } from '@/shared/types/market';

import type { SetupCardData, SetupStatus } from '../types/decision.types';

function parseInvalidationLevel(invalidation?: string): number | null {
  if (!invalidation) return null;
  const match = invalidation.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

/** Advance setup status from price action vs invalidation on candle close. */
export function advanceSetupLifecycle(
  setup: SetupCardData,
  lastCandle: Candle,
): SetupCardData {
  const level = parseInvalidationLevel(setup.invalidation);
  const close = lastCandle.close;

  let status: SetupStatus = setup.status;

  if (level !== null) {
    if (setup.bias === 'bullish' && close < level) {
      status = 'invalidated';
    } else if (setup.bias === 'bearish' && close > level) {
      status = 'invalidated';
    } else if (setup.confidence >= 70 && status === 'forming') {
      status = 'confirmed';
    } else if (setup.confidence >= 55 && status === 'watching') {
      status = 'forming';
    }
  } else if (setup.confidence >= 70) {
    status = setup.status === 'watching' ? 'forming' : setup.status;
  }

  return { ...setup, status };
}

export function applyLifecycleToSetups(
  setups: SetupCardData[],
  candleMap: Map<string, Candle>,
): SetupCardData[] {
  return setups.map((setup) => {
    const candle = candleMap.get(setup.symbol.toUpperCase());
    if (!candle) return setup;
    return advanceSetupLifecycle(setup, candle);
  });
}
