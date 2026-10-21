import type { IntradayCandle, ReplayState } from '../types/intraday.types';

/**
 * Pure intraday replay engine. Future candles are structurally invisible:
 * consumers only ever receive candles up to the cursor.
 *
 * Stepping backward is allowed only inside already-revealed history, so a
 * learner can review what they have seen — they can never peek forward.
 * Decisions are committed at a cursor position; the trading-day service locks
 * them before the next candle is revealed.
 */

export function createReplay(totalCandles: number): ReplayState {
  return { cursor: totalCandles > 0 ? 0 : -1, playing: false, speed: 1, totalCandles };
}

export function visibleCandles<T extends IntradayCandle>(
  candles: readonly T[],
  state: ReplayState,
): T[] {
  if (state.cursor < 0) return [];
  return candles.slice(0, state.cursor + 1);
}

export function stepForward(state: ReplayState): ReplayState {
  const cursor = Math.min(state.totalCandles - 1, state.cursor + 1);
  return { ...state, cursor, playing: cursor < state.totalCandles - 1 ? state.playing : false };
}

/** Advance by the configured playback speed (used by the play timer). */
export function advance(state: ReplayState): ReplayState {
  let next = state;
  for (let i = 0; i < state.speed; i++) next = stepForward(next);
  return next;
}

export function stepBackward(state: ReplayState): ReplayState {
  return { ...state, cursor: Math.max(0, state.cursor - 1), playing: false };
}

export function setPlaying(state: ReplayState, playing: boolean): ReplayState {
  if (playing && state.cursor >= state.totalCandles - 1) return { ...state, playing: false };
  return { ...state, playing };
}

export function setSpeed(state: ReplayState, speed: ReplayState['speed']): ReplayState {
  return { ...state, speed };
}

export function resetReplay(state: ReplayState): ReplayState {
  return createReplay(state.totalCandles);
}

/** 0..1 progress through the session. */
export function replayProgress(state: ReplayState): number {
  if (state.totalCandles <= 0) return 0;
  return (state.cursor + 1) / state.totalCandles;
}

export function isReplayComplete(state: ReplayState): boolean {
  return state.totalCandles > 0 && state.cursor >= state.totalCandles - 1;
}

export function currentCandle<T extends IntradayCandle>(
  candles: readonly T[],
  state: ReplayState,
): T | null {
  return state.cursor >= 0 ? (candles[state.cursor] ?? null) : null;
}
