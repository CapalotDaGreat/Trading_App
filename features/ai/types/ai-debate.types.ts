import type { AiCitation } from '@/features/ai/types/ai.types';

export type DebateSide = 'bull' | 'bear' | 'neutral';

export interface DebateEvidencePoint {
  text: string;
  /** Provenance label — never invented. */
  source:
    | 'indicator'
    | 'news'
    | 'regime'
    | 'portfolio'
    | 'memory'
    | 'timeframe'
    | 'mtf'
    | 'quote'
    | 'pattern'
    | 'levels';
  citation?: string;
}

export interface DebateCase {
  side: DebateSide;
  title: string;
  summary: string;
  points: DebateEvidencePoint[];
  /** Conditions that would strengthen or weaken this case — grounded in available data. */
  whatWouldChange: string[];
}

export interface DebateScores {
  researchPriority: 'high' | 'medium' | 'low';
  researchPriorityLabel: string;
  researchValueScore: number;
  researchValueExplanation: string;
  decisionQualityScore: number;
  decisionQualityExplanation: string;
}

export interface AiDebateResult {
  symbol: string;
  timeframe: string;
  generatedAt: number;
  /** Always all three sides — never single-sided. */
  bullCase: DebateCase;
  bearCase: DebateCase;
  neutralCase: DebateCase;
  scores: DebateScores;
  questionsBeforeResearch: string[];
  citations: AiCitation[];
  evidenceNotes: string[];
  dataAsOf: number;
}
