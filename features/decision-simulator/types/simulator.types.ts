import type { Candle, CandleInterval } from '@/shared/types/market';
import type { MarketRegime } from '@/features/decision/types/decision.types';

export type SimulatorAction = 'research' | 'wait' | 'ignore' | 'create_thesis';

export type SimulatorPhase = 'briefing' | 'deciding' | 'revealed';

export interface SimulatorContextPack {
  indicatorsNote: string;
  bias: 'bullish' | 'bearish' | 'neutral';
  evidenceQuality: number;
  newsHeadlines: { id: string; title: string; source: string }[];
  regimeLabel: string;
  regime?: MarketRegime;
  portfolioNote: string;
  researchTimeMinutes: number;
  memoryNote?: string;
}

export interface SimulatorScores {
  decisionQualityScore: number;
  checklistScore: number;
  riskScore: number;
  disciplineScore: number;
  reasoningScore: number;
  /** Weighted process blend — never includes P&L. */
  processScore: number;
  whatHappened: string;
  whyItMatters: string;
  aiNoticed: string[];
  whatWasMissed: string[];
  learningSummary: string;
  journalPrompt: string;
  academyHint?: { lessonId: string; title: string; reason: string };
  replayHref: string;
}

export interface SimulatorSession {
  id: string;
  symbol: string;
  interval: CandleInterval;
  /** Full history kept private until reveal. */
  fullCandles: Candle[];
  freezeIndex: number;
  visibleCandles: Candle[];
  futureCandles: Candle[];
  context: SimulatorContextPack;
  phase: SimulatorPhase;
  userAction?: SimulatorAction;
  reasoningNote?: string;
  checklist: SimulatorChecklist;
  scores?: SimulatorScores;
  createdAt: number;
  decidedAt?: number;
  revealedAt?: number;
}

export interface SimulatorChecklist {
  reviewedIndicators: boolean;
  notedRegime: boolean;
  consideredPortfolio: boolean;
  setInvalidationThought: boolean;
  respectedTimeBudget: boolean;
}

export interface SimulatorHistoryItem {
  id: string;
  symbol: string;
  action: SimulatorAction;
  processScore: number;
  createdAt: number;
  learningSummary: string;
}
