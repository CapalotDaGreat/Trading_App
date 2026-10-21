import { mulberry32 } from '@/features/simulation/services/scenario-rng';

import type {
  IntradayCandle,
  IntradayScenario,
  IntradayScenarioKind,
  IntradaySessionStage,
} from '../types/intraday.types';

import { validateIntradayCandles } from './candle.service';

/**
 * Deterministic synthetic intraday scenarios.
 *
 * These are fictional educational sessions generated from seeded rules. They
 * are NOT historical prices and are labelled as synthetic everywhere they are
 * shown. No API key, no paid provider, no fabricated market history.
 */

export const SYNTHETIC_PROVENANCE =
  'Synthetic educational scenario — fictional prices generated from seeded rules. Not real market data.';

const KINDS: IntradayScenarioKind[] = [
  'trend-day',
  'range-day',
  'failed-breakout',
  'quiet-day',
  'volatile-day',
];

export interface SyntheticSessionInput {
  seed: number;
  kind?: IntradayScenarioKind;
  symbol?: string;
  /** Session length in 1m candles. Default: a focused 150-minute training session. */
  minutes?: number;
  basePrice?: number;
}

function stageFor(minute: number, total: number): IntradaySessionStage['id'] {
  const t = minute / Math.max(1, total);
  if (t < 0.15) return 'opening';
  if (t < 0.4) return 'development';
  if (t < 0.65) return 'mid-session';
  if (t < 0.9) return 'late-session';
  return 'close';
}

const STAGE_NOTES: Record<IntradaySessionStage['id'], string> = {
  opening: 'Opening minutes: wider ranges and faster repricing are common in this scenario.',
  development: 'Structure develops. Trend, range, or neither — name it before you size anything.',
  'mid-session': 'Mid-session: participation often thins. Weak evidence is a valid reason to wait.',
  'late-session': 'Late session: decide whether the original thesis still exists, or is just hope.',
  close: 'Final minutes: the session review matters more than one last impulse.',
};

export function generateSyntheticSession(input: SyntheticSessionInput): IntradayScenario {
  const rand = mulberry32(Math.abs(Math.floor(input.seed)) || 1);
  const kind = input.kind ?? KINDS[Math.floor(rand() * KINDS.length)]!;
  const symbol = input.symbol ?? 'DAYX';
  const minutes = Math.min(390, Math.max(30, input.minutes ?? 150));
  const sessionId = `synthetic-${symbol.toLowerCase()}-${Math.floor(input.seed)}`;
  // 09:30 exchange-open anchor, expressed in UTC for determinism.
  const startTimestamp = Date.UTC(2026, 0, 5, 9, 30, 0);

  let driftPerMinute = 0;
  let volatility = 0.0009;
  switch (kind) {
    case 'trend-day':
      driftPerMinute = 0.00045;
      volatility = 0.0011;
      break;
    case 'range-day':
      driftPerMinute = 0;
      volatility = 0.0008;
      break;
    case 'failed-breakout':
      driftPerMinute = 0;
      volatility = 0.001;
      break;
    case 'quiet-day':
      driftPerMinute = 0;
      volatility = 0.00045;
      break;
    case 'volatile-day':
      driftPerMinute = 0.0001;
      volatility = 0.0021;
      break;
  }

  const candles: IntradayCandle[] = [];
  let price = input.basePrice ?? 100;
  const rangeAnchor = price;

  for (let minute = 0; minute < minutes; minute++) {
    const stage = stageFor(minute, minutes);
    const stageVol = volatility * (stage === 'opening' ? 1.5 : stage === 'close' ? 1.2 : 1);
    let drift = driftPerMinute;

    if (kind === 'range-day') {
      // Mean-revert toward the anchor so the session stays a range.
      drift = (rangeAnchor - price) * 0.004;
    }
    if (kind === 'failed-breakout') {
      const breakoutStart = Math.floor(minutes * 0.45);
      const breakoutEnd = Math.floor(minutes * 0.58);
      if (minute >= breakoutStart && minute < breakoutEnd) drift = 0.0016;
      else if (minute >= breakoutEnd && minute < breakoutEnd + 12) drift = -0.0022;
      else drift = (rangeAnchor - price) * 0.003;
    }
    if (kind === 'trend-day' && minute > minutes * 0.75) drift = driftPerMinute * 0.3;

    const open = price;
    const shock = (rand() + rand() + rand() - 1.5) / 1.5; // approx. normal in [-1, 1]
    const close = Math.max(1, open * (1 + drift + shock * stageVol));
    const wickUp = Math.abs(rand()) * stageVol * open * 0.7;
    const wickDown = Math.abs(rand()) * stageVol * open * 0.7;
    const high = Math.max(open, close) + wickUp;
    const low = Math.max(0.01, Math.min(open, close) - wickDown);
    // U-shaped participation: busy open/close, thinner middle. Quiet days stay thin.
    const sessionCurve = 0.55 + Math.abs(minute / minutes - 0.5) * 1.1;
    const baseVolume = kind === 'quiet-day' ? 420 : 1400;
    const volume = Math.max(0, Math.round(baseVolume * sessionCurve * (0.6 + rand() * 0.9)));

    candles.push({
      symbol,
      timestamp: startTimestamp + minute * 60_000,
      open: round4(open),
      high: round4(high),
      low: round4(low),
      close: round4(close),
      volume,
      interval: '1m',
      sessionId,
      source: 'synthetic',
      provenance: SYNTHETIC_PROVENANCE,
    });
    price = close;
  }

  const validation = validateIntradayCandles(candles);
  if (!validation.ok) {
    throw new Error(`Generated invalid synthetic session: ${validation.errors[0]}`);
  }

  const stageIds: IntradaySessionStage['id'][] = [
    'opening',
    'development',
    'mid-session',
    'late-session',
    'close',
  ];
  const stages: IntradaySessionStage[] = stageIds.map((id) => ({
    id,
    label: id.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    fromCandleIndex: candles.findIndex((_, i) => stageFor(i, minutes) === id),
    note: STAGE_NOTES[id],
  }));

  return {
    id: sessionId,
    symbol,
    kind,
    sessionId,
    candles,
    stages,
    source: 'synthetic',
    provenance: SYNTHETIC_PROVENANCE,
    briefing:
      'A fictional intraday session. Read the structure as it prints, write a thesis before any simulated order, and remember: finishing flat is a complete outcome.',
  };
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
