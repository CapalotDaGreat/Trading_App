export type LabCurrency = 'USD' | 'EUR' | 'GBP';

export type LabBias = 'long' | 'short';

export type LabAccountSize = 10_000 | 25_000 | 50_000 | 100_000;

export type LabPositionStatus = 'open' | 'closed';

export type LabScenarioId =
  | 'trend_following'
  | 'breakouts'
  | 'support_resistance'
  | 'mean_reversion'
  | 'risk_management'
  | 'freeform';

export interface LabThesisChecklist {
  biasDefined: boolean;
  entryDefined: boolean;
  stopDefined: boolean;
  targetDefined: boolean;
  rrAcceptable: boolean;
  catalystDefined: boolean;
  invalidationDefined: boolean;
  confidenceSet: boolean;
  academyChecklistDone: boolean;
}

export interface LabThesis {
  id: string;
  symbol: string;
  bias: LabBias;
  entryLow: number;
  entryHigh: number;
  stopLoss: number;
  target: number;
  /** Risk/reward as absolute ratio (e.g. 2.5 = 2.5:1). */
  riskReward: number;
  catalyst: string;
  invalidation: string;
  /** Process confidence 0–100 — not a price prediction. */
  confidence: number;
  checklist: LabThesisChecklist;
  scenarioId: LabScenarioId;
  notes: string;
  createdAt: number;
}

export interface LabAiCritique {
  overall: 'ready' | 'caution' | 'block';
  summary: string;
  risk: string;
  confirmation: string;
  regime: string;
  concentration: string;
  checklist: string;
  psychology: string;
  dna: string;
  suggestions: string[];
  /** Never a buy/sell recommendation — process only. */
  disclaimer: string;
}

export interface LabTradeScores {
  processScore: number;
  disciplineScore: number;
  riskScore: number;
  checklistScore: number;
  journalPrompt: string;
  learningSummary: string;
}

export interface LabPosition {
  id: string;
  thesisId: string;
  thesis: LabThesis;
  status: LabPositionStatus;
  quantity: number;
  entryPrice: number;
  /** Mark used for open PnL display — educational only. */
  markPrice: number;
  exitPrice?: number;
  openedAt: number;
  closedAt?: number;
  stopHonored?: boolean;
  critique: LabAiCritique;
  scores?: LabTradeScores;
  accountCurrency: LabCurrency;
}

export interface LabAccount {
  size: LabAccountSize;
  currency: LabCurrency;
  cash: number;
  startingCash: number;
  updatedAt: number;
}

export interface LabChallenge {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  progress: number;
  completed: boolean;
  celebrateCopy: string;
}

export interface LabStats {
  tradesClosed: number;
  avgProcessScore: number;
  avgDisciplineScore: number;
  avgRiskScore: number;
  avgChecklistScore: number;
  ruleAdherencePercent: number;
  avgRiskReward: number;
  winRate: number;
  commonMistakes: string[];
  improvementNote: string;
  /** Explicitly secondary — not the success metric. */
  simulatedPnlNote: string;
}

export const LAB_ACCOUNT_SIZES: LabAccountSize[] = [10_000, 25_000, 50_000, 100_000];

export const LAB_CURRENCIES: LabCurrency[] = ['USD', 'EUR', 'GBP'];

export const LAB_SCENARIOS: {
  id: LabScenarioId;
  title: string;
  description: string;
  academyHint: string;
}[] = [
  {
    id: 'trend_following',
    title: 'Trend following',
    description: 'Practice waiting for pullbacks in the direction of structure.',
    academyHint: 'Apply trend lessons before sizing.',
  },
  {
    id: 'breakouts',
    title: 'Breakouts',
    description: 'Require confirmation — no anticipation entries.',
    academyHint: 'Link from breakout Academy lessons.',
  },
  {
    id: 'support_resistance',
    title: 'Support & resistance',
    description: 'Define levels first; invalidation is the other side of the level.',
    academyHint: 'Map levels before thesis.',
  },
  {
    id: 'mean_reversion',
    title: 'Mean reversion',
    description: 'Only when regime fits — avoid fading strong trends.',
    academyHint: 'Check regime before mean-reversion theses.',
  },
  {
    id: 'risk_management',
    title: 'Risk management',
    description: 'Focus on stop placement and position size discipline.',
    academyHint: 'Risk Academy path → Lab practice.',
  },
  {
    id: 'freeform',
    title: 'Freeform practice',
    description: 'Any structured thesis — still requires a complete plan.',
    academyHint: 'Open Lab after any decision lesson.',
  },
];
