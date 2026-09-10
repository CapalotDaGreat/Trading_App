/**
 * Decision → reveal contract. Reveal is forbidden until a process decision is committed.
 */

export function replayCommitCountRequired(checkpointCount: number): number {
  return Math.max(1, checkpointCount);
}

export function canRevealReplay(input: {
  committedDecisions: number;
  requiredDecisions: number;
  alreadyRevealed?: boolean;
}): boolean {
  if (input.alreadyRevealed) return true;
  return input.committedDecisions >= replayCommitCountRequired(input.requiredDecisions);
}

export function revealCursorAfterCommit(input: {
  cutoffIndex: number;
  horizon: number;
  step?: number;
}): number {
  const step = input.step ?? 6;
  return Math.min(input.horizon - 1, Math.max(input.cutoffIndex, input.cutoffIndex + step));
}

export interface ReplayResetSnapshot {
  phase: 'intro';
  revealed: false;
  committedDecisions: 0;
  revealCursor: undefined;
}

export function resetReplaySessionState(): ReplayResetSnapshot {
  return {
    phase: 'intro',
    revealed: false,
    committedDecisions: 0,
    revealCursor: undefined,
  };
}
