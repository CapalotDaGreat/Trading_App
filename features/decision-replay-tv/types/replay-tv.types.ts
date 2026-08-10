import type { DataSourceKind } from '@/features/markets/constants/data-source';
import type { Candle, CandleInterval } from '@/shared/types/market';

export type ReplayTvDifficulty = 'foundation' | 'intermediate' | 'advanced' | 'expert';

export type ReplayTvCollectionId =
  | 'featured'
  | 'crashes'
  | 'manias'
  | 'policy'
  | 'earnings'
  | 'crypto'
  | 'regime_changes'
  | 'false_breakouts'
  | 'psychology'
  | 'risk_management'
  | 'uncertainty';

export type ReplayTvMarketFocus = 'stocks' | 'forex' | 'crypto' | 'macro';

export type ReplayTvTradingStyle = 'swing' | 'day' | 'position' | 'scalp' | 'any';

export type ReplayTvScoringEmphasis =
  | 'evidence'
  | 'risk'
  | 'invalidation'
  | 'alternatives'
  | 'patience'
  | 'information_use'
  | 'process';

export type ReplayTvPhase =
  | 'intro'
  | 'context'
  | 'watching'
  | 'decision'
  | 'mentor'
  | 'reveal'
  | 'coaching'
  | 'complete';

/** Process decision at a freeze — never a trade instruction. */
export type ReplayTvDecision =
  | 'research_more'
  | 'write_thesis'
  | 'wait'
  | 'skip'
  | 'protect_attention';

export interface ReplayTvNewsItem {
  id: string;
  /** Bar index at which this headline becomes available (inclusive). */
  availableAtIndex: number;
  headline: string;
  detail: string;
}

export interface ReplayTvEducationalLink {
  kind: 'academy' | 'checklist' | 'mentor';
  label: string;
  href: string;
}

export interface ReplayTvCheckpoint {
  id: string;
  /** Bar index (inclusive) where future is still hidden. */
  freezeIndex: number;
  prompt: string;
  mentorFollowUp: string;
  /** Spoiler-free teaching hint after reveal only. */
  teachingNote: string;
  /** What the user may know at this freeze — never future facts. */
  availableDataNotes?: string[];
  /** News item ids visible at this checkpoint (must already be available). */
  newsIdsVisible?: string[];
  /** Optional subset of decisions offered at this pause. */
  choices?: ReplayTvDecision[];
  hypothesisPrompt?: string;
}

export interface ReplayTvEpisode {
  id: string;
  title: string;
  subtitle: string;
  /** Spoiler-safe teaser — never reveals the outcome. */
  teaser: string;
  /** Shown only after reveal. */
  historicalOutcome: string;
  collectionIds: ReplayTvCollectionId[];
  symbol: string;
  symbolLabel: string;
  interval: CandleInterval;
  difficulty: ReplayTvDifficulty;
  skills: string[];
  eraLabel: string;
  /** Educational reconstruction — always sample/approximate provenance. */
  dataKind: DataSourceKind;
  provenanceNote: string;
  contextBullets: string[];
  checkpoints: ReplayTvCheckpoint[];
  /** Seed for deterministic educational candle path. */
  pathSeed: number;
  /** Target path shape for generator. */
  pathShape: 'crash' | 'meltup' | 'whipsaw' | 'gap_down' | 'slow_bleed' | 'squeeze';
  barCount: number;
  academyLessonIds: string[];
  durationMinutes: number;
  estimatedDecisionCount: number;
  markets: ReplayTvMarketFocus[];
  tradingStyles: ReplayTvTradingStyle[];
  availableNews: ReplayTvNewsItem[];
  scoringEmphasis: ReplayTvScoringEmphasis[];
  educationalLinks: ReplayTvEducationalLink[];
  /** Premium-only when true (advanced library / expert rooms). */
  premiumOnly?: boolean;
}

export interface ReplayTvCollection {
  id: ReplayTvCollectionId;
  title: string;
  description: string;
}

export interface ReplayTvChecklist {
  namedInvalidation: boolean;
  notedRegime: boolean;
  consideredTimeBudget: boolean;
  wroteReasoning: boolean;
  consideredAlternative: boolean;
}

export interface ReplayTvDecisionRecord {
  checkpointId: string;
  decision: ReplayTvDecision;
  reasoning: string;
  at: number;
}

export interface ReplayTvScores {
  processQuality: number;
  reasoningQuality: number;
  checklistIntegrity: number;
  patience: number;
  evidenceQuality: number;
  riskAwareness: number;
  invalidationClarity: number;
  alternativeConsideration: number;
  overall: number;
  coaching: string[];
  journalPrompt: string;
  academyHint?: { lessonId: string; reason: string };
}

export interface ReplayTvSession {
  id: string;
  episodeId: string;
  phase: ReplayTvPhase;
  createdAt: number;
  /** Full educational path kept in memory; UI must use visible slice helpers. */
  fullCandles: Candle[];
  /** Index of current checkpoint in episode.checkpoints */
  checkpointIndex: number;
  decisions: ReplayTvDecisionRecord[];
  checklist: ReplayTvChecklist;
  mentorReply?: string;
  scores?: ReplayTvScores;
  revealed: boolean;
}

export interface ReplayTvProgress {
  completedEpisodeIds: string[];
  attemptCount: number;
  streakDays: number;
  lastCompletedDayKey: string | null;
  masteryByCollection: Partial<Record<ReplayTvCollectionId, number>>;
  bestProcessByEpisode: Record<string, number>;
  /** UTC month key YYYY-MM for monthly free session counters. */
  monthlyKey: string | null;
  monthlyCompletions: number;
}

export interface ReplayTvJournalReflection {
  title: string;
  body: string;
  episodeId: string;
  processScore: number;
  checkpointCount: number;
  skills: string[];
}
