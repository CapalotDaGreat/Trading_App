import type { DataFreshnessLevel } from '@/features/markets/constants/freshness';
import type { DataSourceKind } from '@/features/markets/constants/data-source';

import type { AiCitation, AiDataSource } from './ai.types';

/** Named evidence-quality pillar — never a price-direction probability. */
export type ConfidencePillarId =
  | 'trend'
  | 'momentum'
  | 'volume'
  | 'volatility'
  | 'macro'
  | 'news'
  | 'breadth'
  | 'regimeFit'
  | 'dataFreshness';

export interface ConfidencePillar {
  id: ConfidencePillarId;
  label: string;
  score: number;
  /** Why this pillar scored this way (educational, not predictive). */
  explanation: string;
  agrees: boolean;
}

export interface ConfidenceBreakdown {
  /** Aggregate evidence/output quality 0–100. */
  overall: number;
  label: string;
  pillars: ConfidencePillar[];
  notice: string;
}

export type EvidenceModuleId =
  | 'rsi'
  | 'macd'
  | 'adx'
  | 'volume'
  | 'structure'
  | 'news'
  | 'regime'
  | 'portfolio'
  | 'memory'
  | 'quote';

export interface EvidenceItem {
  id: EvidenceModuleId;
  label: string;
  detail: string;
  /** In-app deep link to related module when available. */
  href?: string;
  present: boolean;
}

export interface EvidencePack {
  observation: string;
  items: EvidenceItem[];
}

export interface AiCounterfactual {
  label: string;
  detail: string;
}

export type AiChangeDriver =
  | 'indicator'
  | 'news'
  | 'regime'
  | 'volatility'
  | 'portfolio'
  | 'freshness'
  | 'other';

export interface AiChangeDriverDetail {
  driver: AiChangeDriver;
  label: string;
  detail: string;
}

export interface AiRecommendationSnapshot {
  symbol: string;
  at: number;
  action?: 'research' | 'watch' | 'skip';
  overallConfidence: number;
  bias?: 'bullish' | 'bearish' | 'neutral';
  regimeLabel?: string;
  rsi?: number;
  adx?: number;
  newsCount?: number;
  note?: string;
}

export interface AiWhyChanged {
  symbol: string;
  previousAt: number;
  currentAt: number;
  previousSummary: string;
  currentSummary: string;
  reason: string;
  drivers: AiChangeDriverDetail[];
}

export interface AiTrustMeta {
  dataAsOf: number;
  freshness: DataFreshnessLevel;
  providerLabel: string;
  source: AiDataSource;
  dataKind: DataSourceKind;
  citations: AiCitation[];
  educationalReminder: string;
  /** Indicator / module citations for Evidence Inspector. */
  indicatorCitations: AiCitation[];
}

/** Phase B — always-on research analyst briefing (never signal language). */
export interface AiTrustBriefing {
  /** One-line reliability answer: “How reliable is this?” */
  reliabilitySummary: string;
  supports: string[];
  contradicts: string[];
  unknowns: string[];
  riskFactors: string[];
  assumptions: string[];
  missingInformation: string[];
  /** “What would invalidate this?” */
  invalidateQuestions: string[];
  freshnessExplanation: string;
  dataQualityExplanation: string;
  modelLimitations: string[];
  uncertaintyNote: string;
  alternativeViewpoint: string;
}

export interface AiConfidenceHistoryPoint {
  at: number;
  overallConfidence: number;
  action?: 'research' | 'watch' | 'skip';
  bias?: 'bullish' | 'bearish' | 'neutral';
  summary: string;
}

/** Full trust payload attached to AI analysis / chat. */
export interface AiTrustPayload {
  confidence: ConfidenceBreakdown;
  evidence: EvidencePack;
  counterfactuals: AiCounterfactual[];
  briefing: AiTrustBriefing;
  whyChanged?: AiWhyChanged | null;
  confidenceHistory?: AiConfidenceHistoryPoint[];
  meta: AiTrustMeta;
}

/**
 * Learning memory for AI personalization — process traits only, no PII.
 * Derived from Trader Memory / DNA / coach signals.
 */
export interface AiLearningMemory {
  favoriteSetups: string[];
  learningStyleHint: string;
  strongestMarkets: string[];
  weakestMarkets: string[];
  preferredIndicators: string[];
  commonMistakes: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  journalConsistencyHint: string;
  replayBehaviourHint: string;
  psychologyReminder: string;
  updatedAt: number;
}
