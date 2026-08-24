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

/** Qualitative evidence coverage — never a price-direction probability. */
export type AiEvidenceLevel = 'high' | 'moderate' | 'limited' | 'insufficient';

export interface ConfidencePillar {
  id: ConfidencePillarId;
  label: string;
  score: number;
  /** Why this pillar scored this way (educational, not predictive). */
  explanation: string;
  agrees: boolean;
}

export interface ConfidenceBreakdown {
  /** Aggregate evidence/output quality 0–100 — never P(price direction). */
  overall: number;
  label: string;
  pillars: ConfidencePillar[];
  notice: string;
  /** User-facing uncertainty. Never a substitute for a probability. */
  evidenceLevel: AiEvidenceLevel;
  /** Calm "why this evidence quality" bullets — never P(profit). */
  evidenceWhy?: string[];
  /** What would raise evidence quality, not forecast confidence. */
  whatWouldImproveEvidence?: string[];
  availableEvidence?: string[];
  missingEvidence?: string[];
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

export type AiAnswerMode =
  | 'quick'
  | 'deep_research'
  | 'coach'
  | 'review'
  | 'explain'
  | 'replay_coach';

export type AiAnswerDepth = 'concise' | 'balanced' | 'detailed';

export interface AiSourceAttribution {
  label: string;
  timestamp: number;
  freshness: DataFreshnessLevel;
  dataKind: DataSourceKind;
}

export interface AiMentorMemoryUse {
  used: string[];
  notUsed: string[];
  disclosure: string;
}

export interface AiSelfCheckResult {
  passed: boolean;
  downgraded: boolean;
  evidenceLevel: AiEvidenceLevel;
  flags: string[];
}

export interface AiStructuredMentorAnswer {
  mode: AiAnswerMode;
  depth: AiAnswerDepth;
  evidenceLevel: AiEvidenceLevel;
  whatIKnow: string[];
  whatIDontKnow: string[];
  evidence: string[];
  /** Kept for compatibility — same honesty contract as `interpretation`. */
  whyItMatters: string;
  /** Distinct from evidence: what the pack may mean for research time, never a forecast. */
  interpretation: string;
  whatChanged: string;
  whatWouldChange: string[];
  suggestedResearchAction: string;
  memoryUse: AiMentorMemoryUse;
  sources: AiSourceAttribution[];
  selfCheck: AiSelfCheckResult;
  /** Qualitative reasons for the evidence level — never a probability. */
  evidenceWhy?: string[];
  whatWouldImproveEvidence?: string[];
  /** First-class uncertainty sentence when the honest answer is "I don't know". */
  honestyLead?: string | null;
  /** Visible freshness inventory — trust feature, not decoration. */
  availableEvidence: string[];
  missingEvidence: string[];
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
  evidenceLevel: AiEvidenceLevel;
  mentorAnswer?: AiStructuredMentorAnswer;
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
