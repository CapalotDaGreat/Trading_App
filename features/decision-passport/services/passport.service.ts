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
    updatedAt: Date.now(),
  };
}
