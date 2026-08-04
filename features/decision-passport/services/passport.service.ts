import type { SimulatorAction, SimulatorScores } from '@/features/decision-simulator/types/simulator.types';

export type PassportCredentialSource =
  | 'simulator'
  | 'academy'
  | 'lab'
  | 'journal'
  | 'replay'
  | 'heatmap'
  | 'mentor';

export interface PassportCredential {
  id: string;
  title: string;
  detail: string;
  earnedAt: number;
  source: PassportCredentialSource;
}

export interface DecisionPassportSnapshot {
  processSessions: number;
  averageProcessScore: number;
  credentials: PassportCredential[];
  lastAction?: SimulatorAction;
  updatedAt: number;
}

export function buildPassportCredential(input: {
  symbol: string;
  action: SimulatorAction;
  scores: SimulatorScores;
}): PassportCredential | null {
  if (input.scores.processScore < 70) return null;

  if (input.scores.disciplineScore >= 85 && (input.action === 'wait' || input.action === 'ignore')) {
    return {
      id: `cred-patience-${input.symbol}-${Date.now()}`,
      title: 'Attention Discipline',
      detail: `Chose ${input.action} with high process quality on ${input.symbol}.`,
      earnedAt: Date.now(),
      source: 'simulator',
    };
  }
  if (input.scores.checklistScore >= 80) {
    return {
      id: `cred-checklist-${input.symbol}-${Date.now()}`,
      title: 'Checklist Integrity',
      detail: `Completed simulator checklist discipline on ${input.symbol}.`,
      earnedAt: Date.now(),
      source: 'simulator',
    };
  }
  if (input.action === 'create_thesis' && input.scores.reasoningScore >= 70) {
    return {
      id: `cred-thesis-${input.symbol}-${Date.now()}`,
      title: 'Thesis Builder',
      detail: `Structured reasoning before commitment on ${input.symbol}.`,
      earnedAt: Date.now(),
      source: 'simulator',
    };
  }
  if (input.scores.processScore >= 85) {
    return {
      id: `cred-process-${input.symbol}-${Date.now()}`,
      title: 'Process Operator',
      detail: `High process score (${input.scores.processScore}) — never graded on P&L.`,
      earnedAt: Date.now(),
      source: 'simulator',
    };
  }
  return null;
}

export function buildLabProcessCredential(input: {
  symbol: string;
  processScore: number;
  stopHonored: boolean;
  journaled: boolean;
}): PassportCredential | null {
  if (input.processScore < 70) return null;
  if (input.stopHonored && input.journaled) {
    return {
      id: `cred-lab-close-${input.symbol}-${Date.now()}`,
      title: 'Lab Close Discipline',
      detail: `Honored invalidation and journaled the Lab close on ${input.symbol}.`,
      earnedAt: Date.now(),
      source: 'lab',
    };
  }
  if (input.processScore >= 85) {
    return {
      id: `cred-lab-process-${input.symbol}-${Date.now()}`,
      title: 'Lab Process Operator',
      detail: `High Lab process score (${input.processScore}) on ${input.symbol}.`,
      earnedAt: Date.now(),
      source: 'lab',
    };
  }
  return null;
}

/**
 * Stable milestone credentials derived from cross-system activity.
 * Idempotent IDs so re-sync does not duplicate.
 */
export function deriveSystemCredentials(input: {
  journalCount: number;
  academyCompleted: number;
  replayCount: number;
  labClosedCount: number;
  labAvgProcessScore: number;
}): PassportCredential[] {
  const now = Date.now();
  const out: PassportCredential[] = [];

  if (input.journalCount >= 5) {
    out.push({
      id: 'cred-system-journal-5',
      title: 'Journal Habit',
      detail: `${input.journalCount} journal entries — process reflection is compounding.`,
      earnedAt: now,
      source: 'journal',
    });
  }
  if (input.journalCount >= 25) {
    out.push({
      id: 'cred-system-journal-25',
      title: 'Journal Depth',
      detail: 'Sustained journaling across many decisions.',
      earnedAt: now,
      source: 'journal',
    });
  }
  if (input.academyCompleted >= 3) {
    out.push({
      id: 'cred-system-academy-3',
      title: 'Academy Starter',
      detail: `${input.academyCompleted} lessons completed — learning loops into decisions.`,
      earnedAt: now,
      source: 'academy',
    });
  }
  if (input.academyCompleted >= 10) {
    out.push({
      id: 'cred-system-academy-10',
      title: 'Academy Scholar',
      detail: 'Double-digit Academy completions with practice intent.',
      earnedAt: now,
      source: 'academy',
    });
  }
  if (input.replayCount >= 3) {
    out.push({
      id: 'cred-system-replay-3',
      title: 'Replay Reflector',
      detail: `${input.replayCount} decision replays captured as learning events.`,
      earnedAt: now,
      source: 'replay',
    });
  }
  if (input.labClosedCount >= 3 && input.labAvgProcessScore >= 70) {
    out.push({
      id: 'cred-system-lab-3',
      title: 'Lab Practitioner',
      detail: `Closed ${input.labClosedCount} Lab theses with avg process ${Math.round(input.labAvgProcessScore)}.`,
      earnedAt: now,
      source: 'lab',
    });
  }

  return out;
}

export function summarizePassport(input: {
  processScores: number[];
  credentials: PassportCredential[];
  lastAction?: SimulatorAction;
}): DecisionPassportSnapshot {
  const processSessions = input.processScores.length;
  const averageProcessScore =
    processSessions === 0
      ? 0
      : Math.round(input.processScores.reduce((s, n) => s + n, 0) / processSessions);

  return {
    processSessions,
    averageProcessScore,
    credentials: input.credentials.slice(0, 20),
    lastAction: input.lastAction,
    // Stable for React/Zustand consumers — do not stamp Date.now() here.
    updatedAt: 0,
  };
}
